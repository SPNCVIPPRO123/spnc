import { ClipboardList, Clock, Compass, MessageCircleHeart, ShieldCheck } from "lucide-react";
import { OpenChatButton } from "@/components/ChatWidget";
import { siteConfig } from "@/lib/siteConfig";

export const metadata = { title: "Khảo sát nhanh" };

const FEATURES = [
  { icon: Clock, title: "Chỉ vài phút", text: "Những câu hỏi ngắn về tâm trạng, giấc ngủ, việc học trong 2 tuần gần đây." },
  { icon: Compass, title: "Gợi ý bước tiếp theo", text: "Sau khi làm xong, bạn sẽ nhận được gợi ý phù hợp với tình trạng của mình." },
  { icon: ShieldCheck, title: "Không phải chẩn đoán", text: "Khảo sát chỉ giúp bạn tự nhìn lại, không dán nhãn hay kết luận bạn bị bệnh." },
];

// Trang tạm — sẽ thay bằng bảng khảo sát thật ở bước sau.
export default function SurveyPage() {
  return (
    <>
      <section className="page-hero tone-sun">
        <div className="container">
          <span className="page-hero-icon">
            <ClipboardList size={32} aria-hidden="true" />
          </span>
          <span className="soon-badge">Sắp ra mắt</span>
          <h1>Khảo sát nhanh</h1>
          <p className="lead">
            Đôi khi mình không rõ vì sao mình thấy mệt, thấy buồn. Bài khảo sát ngắn này giúp bạn dừng lại một chút và lắng
            nghe chính mình.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div className="pillar" key={title}>
                <span className="pillar-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>

          <div className="cta-card">
            <div>
              <h2>Trong lúc chờ khảo sát hoàn thiện…</h2>
              <p>Bạn có thể kể với {siteConfig.botName} về tâm trạng gần đây của mình.</p>
            </div>
            <OpenChatButton className="btn btn-primary btn-lg" message="Mình muốn tìm hiểu xem tâm trạng gần đây của mình thế nào.">
              <MessageCircleHeart size={20} aria-hidden="true" /> Trò chuyện ngay
            </OpenChatButton>
          </div>
        </div>
      </section>
    </>
  );
}
