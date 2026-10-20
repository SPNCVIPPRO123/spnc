import Link from "next/link";
import { ExternalLink, Info, Newspaper } from "lucide-react";
import NewsCard from "@/components/NewsCard";
import { getNews, NEWS_CATEGORIES, NEWS_SOURCE, type NewsCategory } from "@/lib/news";

// Nội dung chung của trang /tin-tuc và các tab /tin-tuc/<chủ đề>.
export default async function NewsPage({ category }: { category: NewsCategory }) {
  const items = await getNews(category.id, 12);

  return (
    <>
      <section className="page-hero tone-sky">
        <div className="container">
          <span className="page-hero-icon">
            <Newspaper size={32} aria-hidden="true" />
          </span>
          <h1>Tin tức tâm lý học đường</h1>
          <p className="lead">
            Tin mới về tư vấn tâm lý và công tác xã hội trường học, tự động cập nhật từ{" "}
            <a href={NEWS_SOURCE.url} target="_blank" rel="noopener noreferrer">
              {NEWS_SOURCE.name}
            </a>
            .
          </p>
        </div>
      </section>

      <section className="section news-section">
        <div className="container">
          <nav className="news-tabs" aria-label="Chủ đề tin tức">
            {NEWS_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={c.slug === "tat-ca" ? "/tin-tuc" : `/tin-tuc/${c.slug}`}
                className={c.slug === category.slug ? "is-active" : undefined}
                aria-current={c.slug === category.slug ? "page" : undefined}
              >
                {c.label}
              </Link>
            ))}
          </nav>

          {items && items.length > 0 ? (
            <div className="news-grid">
              {items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="news-empty">
              <Info size={28} aria-hidden="true" />
              <p>
                {items ? "Chưa có bài viết nào trong mục này." : "Tạm thời chưa tải được tin tức, bạn quay lại sau ít phút nhé."}{" "}
                Bạn có thể xem trực tiếp tại{" "}
                <a href={NEWS_SOURCE.listUrl} target="_blank" rel="noopener noreferrer">
                  trang tin tức của Bộ GD&amp;ĐT
                </a>
                .
              </p>
            </div>
          )}

          <div className="news-source-note">
            <p>
              Nội dung thuộc bản quyền của {NEWS_SOURCE.name}. Website chỉ hiển thị tóm tắt, bấm vào từng tin để đọc bài
              gốc.
            </p>
            <a className="btn btn-outline" href={NEWS_SOURCE.listUrl} target="_blank" rel="noopener noreferrer">
              Xem tất cả tin tại trang của Bộ <ExternalLink size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
