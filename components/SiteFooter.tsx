import Link from "next/link";
import { Phone } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { siteConfig } from "@/lib/siteConfig";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="brand">
            <LogoMark />
            <span>
              <strong>{siteConfig.siteName}</strong>
              <small>Tâm lý học đường</small>
            </span>
          </Link>
          <p>
            Góc nhỏ lắng nghe của học sinh {siteConfig.schoolName}. Ở đây không có câu hỏi nào là ngớ ngẩn, và không có
            cảm xúc nào là sai.
          </p>
        </div>

        <div>
          <h3>Khám phá</h3>
          <ul>
            <li>
              <Link href="/#tim-hieu">Tâm lý học đường là gì?</Link>
            </li>
            <li>
              <Link href={siteConfig.surveyPath}>Khảo sát nhanh</Link>
            </li>
            <li>
              <Link href={siteConfig.counselingPath}>Tham vấn ẩn danh</Link>
            </li>
            <li>
              <Link href="/#hoi-dap">Hỏi đáp</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3>Gặp trực tiếp</h3>
          <p>{siteConfig.counselingRoom}</p>
        </div>

        <div>
          <h3>Cần hỗ trợ khẩn cấp?</h3>
          <ul className="footer-hotlines">
            {siteConfig.hotlines.map((h) => (
              <li key={h.number}>
                <a href={`tel:${h.number}`}>
                  <Phone size={14} aria-hidden="true" /> {h.number}
                </a>
                <span>{h.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} {siteConfig.schoolName}</p>
        <p>Thông tin trên website chỉ mang tính tham khảo, không thay thế tư vấn của chuyên viên tâm lý hoặc bác sĩ.</p>
      </div>
    </footer>
  );
}
