"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import NewsCard from "@/components/NewsCard";
import { NEWS_SOURCE, newsApiUrl, parseNews, type NewsItem } from "@/lib/news";

// Dự phòng khi máy chủ không lấy được tin: trình duyệt của người xem (ở Việt Nam)
// lấy tin trực tiếp từ trang của Bộ GD&ĐT. Trang nguồn cho phép việc này (CORS).
export default function ClientNews({ categoryId, limit }: { categoryId: number; limit: number }) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setItems(null);
    setFailed(false);
    fetch(newsApiUrl(categoryId, limit), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setItems(parseNews(data)))
      .catch((err) => {
        if (err.name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, [categoryId, limit]);

  if (failed || (items && items.length === 0)) {
    return (
      <div className="news-empty">
        <Info size={28} aria-hidden="true" />
        <p>
          {failed ? "Tạm thời chưa tải được tin tức, bạn quay lại sau ít phút nhé." : "Chưa có bài viết nào trong mục này."}{" "}
          Bạn có thể xem trực tiếp tại{" "}
          <a href={NEWS_SOURCE.listUrl} target="_blank" rel="noopener noreferrer">
            trang tin tức của Bộ GD&amp;ĐT
          </a>
          .
        </p>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="news-grid" aria-busy="true" aria-label="Đang tải tin tức">
        {Array.from({ length: Math.min(limit, 6) }, (_, i) => (
          <div className="news-card news-skeleton" key={i}>
            <div className="news-thumb" />
            <div className="news-body">
              <span className="sk-line short" />
              <span className="sk-line" />
              <span className="sk-line" />
              <span className="sk-line mid" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="news-grid">
      {items.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
