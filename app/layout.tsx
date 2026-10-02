import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";
import { siteConfig } from "@/lib/siteConfig";
import "./globals.css";

export const metadata: Metadata = {
  title: `${siteConfig.siteName} – Tâm lý học đường`,
  description: `Website tâm lý học đường của ${siteConfig.schoolName}: tìm hiểu, khảo sát nhanh và tham vấn ẩn danh.`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <nav className="site-nav">
          <Link href="/" className="brand">
            🌱 {siteConfig.siteName}
          </Link>
          <div className="nav-links">
            <Link href="/#tim-hieu">Tìm hiểu</Link>
            <Link href={siteConfig.surveyPath}>Khảo sát nhanh</Link>
            <Link href={siteConfig.counselingPath}>Tham vấn</Link>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="site-footer">
          <p>
            <strong>Cần hỗ trợ khẩn cấp?</strong>{" "}
            {siteConfig.hotlines.map((h, i) => (
              <span key={h.number}>
                {i > 0 && " · "}
                Gọi <a href={`tel:${h.number}`}>{h.number}</a> ({h.label})
              </span>
            ))}
          </p>
          <p>
            © {siteConfig.schoolName}. Thông tin trên website chỉ mang tính tham khảo, không thay thế tư vấn của chuyên
            viên tâm lý hoặc bác sĩ.
          </p>
        </footer>
        <ChatWidget />
      </body>
    </html>
  );
}
