import { OpenChatButton } from "@/components/ChatWidget";
import { siteConfig } from "@/lib/siteConfig";

export const metadata = { title: "Tham vấn tâm lý" };

// Trang tạm — sẽ thay bằng chức năng đặt lịch tham vấn trực tuyến (có tuỳ chọn ẩn danh) ở bước sau.
export default function CounselingPage() {
  return (
    <section className="section">
      <h1>🤝 Tham vấn tâm lý</h1>
      <p>Chức năng đặt lịch tham vấn trực tuyến (có thể ẩn danh) đang được xây dựng.</p>
      <p>
        Hiện tại bạn có thể gặp trực tiếp tại: <strong>{siteConfig.counselingRoom}</strong>.
      </p>
      <OpenChatButton className="btn btn-primary">💬 Trò chuyện với trợ lý AI</OpenChatButton>
    </section>
  );
}
