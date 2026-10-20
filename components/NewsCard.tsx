import { CalendarDays, ExternalLink, Newspaper } from "lucide-react";
import type { NewsItem } from "@/lib/news";
import { NEWS_SOURCE } from "@/lib/news";

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <a className="news-card" href={item.link} target="_blank" rel="noopener noreferrer">
      <div className="news-thumb">
        {item.image ? (
          // Ảnh lấy trực tiếp từ trang nguồn.
          <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <span className="news-thumb-empty" aria-hidden="true">
            <Newspaper size={36} />
          </span>
        )}
        {item.tag && <span className="news-tag">{item.tag}</span>}
      </div>
      <div className="news-body">
        <span className="news-date">
          <CalendarDays size={14} aria-hidden="true" /> {item.date}
        </span>
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
        <span className="news-more">
          Đọc tại {NEWS_SOURCE.shortName} <ExternalLink size={14} aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}
