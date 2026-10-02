import { OpenChatButton } from "@/components/ChatWidget";

export const metadata = { title: "Khảo sát nhanh" };

// Trang tạm — sẽ thay bằng bảng khảo sát thật ở bước sau.
export default function SurveyPage() {
  return (
    <section className="section">
      <h1>📝 Khảo sát nhanh</h1>
      <p>Chức năng này đang được xây dựng. Trong lúc chờ, bạn có thể trò chuyện với trợ lý AI.</p>
      <OpenChatButton className="btn btn-primary">💬 Trò chuyện ngay</OpenChatButton>
    </section>
  );
}
