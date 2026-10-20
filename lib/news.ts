// Lấy tin tức tự động từ Cổng thông tin Công tác xã hội & Tư vấn tâm lý trường học (Bộ GD&ĐT).
// Trang nguồn làm bằng WordPress nên có sẵn API trả dữ liệu dạng JSON (tiêu đề, ngày, ảnh, tóm tắt).
// Web chỉ hiển thị tóm tắt và dẫn link về bài gốc, không sao chép toàn bộ bài viết.

export const NEWS_SOURCE = {
  name: "Cổng thông tin Công tác xã hội & Tư vấn tâm lý trường học – Bộ GD&ĐT",
  shortName: "Bộ GD&ĐT",
  url: "https://moet-congtacxahoi-tuvantamly.edu.vn",
  listUrl: "https://moet-congtacxahoi-tuvantamly.edu.vn/hoi-dap/tin-tuc/tin-tuc-chung/",
};

// Tự lấy tin mới sau mỗi khoảng thời gian này (giây). 3600 = 1 giờ.
export const NEWS_REVALIDATE_SECONDS = 3600;

// Các mục tin hiển thị thành tab trên trang /tin-tuc. `id` là mã danh mục trên trang nguồn.
export const NEWS_CATEGORIES = [
  { slug: "tat-ca", label: "Tất cả tin tức", id: 69 },
  { slug: "tu-van-tam-ly", label: "Tư vấn tâm lý", id: 70 },
  { slug: "cong-tac-xa-hoi", label: "Công tác xã hội", id: 71 },
  { slug: "kien-thuc-tam-ly", label: "Kiến thức tâm lý", id: 97 },
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export type NewsItem = {
  id: number;
  title: string;
  excerpt: string;
  date: string; // dạng 12/10/2026
  link: string;
  image: string | null;
  tag: string | null;
};

// Nhãn hiển thị trên thẻ tin, dựa vào danh mục của bài viết.
const TAGS: Record<number, string> = {
  70: "Tư vấn tâm lý",
  109: "Tư vấn tâm lý",
  71: "Công tác xã hội",
  108: "Công tác xã hội",
  97: "Kiến thức tâm lý",
  80: "Chỉ đạo",
};

type WpMedia = {
  source_url?: string;
  media_details?: { sizes?: Record<string, { source_url: string }> };
};

type WpPost = {
  id: number;
  date: string;
  link: string;
  categories?: number[];
  title: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: { "wp:featuredmedia"?: WpMedia[] };
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(n) ? match : String.fromCodePoint(n);
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

function toPlainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\[\s*(…|\.\.\.)\s*\]/g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function pickImage(media?: WpMedia): string | null {
  if (!media) return null;
  const sizes = media.media_details?.sizes ?? {};
  return sizes.medium_large?.source_url ?? sizes.large?.source_url ?? media.source_url ?? null;
}

function toNewsItem(post: WpPost): NewsItem {
  return {
    id: post.id,
    title: toPlainText(post.title.rendered),
    excerpt: toPlainText(post.excerpt.rendered),
    date: formatDate(post.date),
    link: post.link,
    image: pickImage(post._embedded?.["wp:featuredmedia"]?.[0]),
    tag: post.categories?.map((c) => TAGS[c]).find(Boolean) ?? null,
  };
}

// Lấy `limit` bài mới nhất trong một danh mục.
// Trả về null nếu không lấy được (trang nguồn lỗi, mạng chậm…) để giao diện hiện thông báo thay thế.
export async function getNews(categoryId: number, limit = 12): Promise<NewsItem[] | null> {
  const url =
    `${NEWS_SOURCE.url}/wp-json/wp/v2/posts?categories=${categoryId}&per_page=${limit}` +
    `&_embed=wp:featuredmedia&_fields=id,date,link,categories,title,excerpt,_links,_embedded`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "BanDongHanh/1.0 (website tam ly hoc duong)" },
      next: { revalidate: NEWS_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = (await res.json()) as WpPost[];
    return posts.map(toNewsItem);
  } catch (err) {
    console.error("[news] Không lấy được tin tức:", err);
    // Khi đang build thì hiện thông báo thay thế để build không bị hỏng.
    // Khi web đang chạy thì báo lỗi để Vercel giữ lại danh sách tin lấy được lần trước.
    if (process.env.NEXT_PHASE === "phase-production-build") return null;
    throw err;
  }
}
