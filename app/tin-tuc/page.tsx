import NewsPage from "@/components/NewsPage";
import { NEWS_CATEGORIES } from "@/lib/news";

export const metadata = { title: "Tin tức" };

// Tự động lấy tin mới mỗi giờ (giữ bằng NEWS_REVALIDATE_SECONDS trong lib/news.ts).
export const revalidate = 3600;

export default function NewsIndexPage() {
  return <NewsPage category={NEWS_CATEGORIES[0]} />;
}
