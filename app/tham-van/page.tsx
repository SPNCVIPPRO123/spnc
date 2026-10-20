import { CalendarCheck, EyeOff, HeartHandshake, MessageCircleHeart, MessagesSquare, School, ShieldCheck } from "lucide-react";
import { OpenChatButton } from "@/components/ChatWidget";
import { siteConfig } from "@/lib/siteConfig";

export const metadata = { title: "Tham vấn tâm lý" };

const OPTIONS = [
  {
    icon: EyeOff,
    tone: "lavender",
    title: "Trực tuyến – ẩn danh",
    text: "Trò chuyện với chuyên viên mà không cần cho biết họ tên, lớp.",
    status: "Sắp ra mắt",
  },
  {
    icon: MessagesSquare,
    tone: "sky",
    title: "Trực tuyến – có đặt lịch",
    text: "Chọn thời gian phù hợp để trò chuyện riêng với chuyên viên.",
    status: "Sắp ra mắt",
  },
  {
    icon: School,
    tone: "mint",
    title: "Gặp trực tiếp",
    text: siteConfig.counselingRoom,
    status: "Đang hoạt động",
  },
];

const STEPS = [
  { icon: HeartHandshake, title: "Chọn hình thức", text: "Ẩn danh hay có danh tính, trực tuyến hay trực tiếp, tuỳ bạn." },
  { icon: CalendarCheck, title: "Chọn thời gian", text: "Chọn khung giờ bạn thấy thoải mái, không ảnh hưởng giờ học." },
  { icon: MessageCircleHeart, title: "Trò chuyện", text: "Chuyên viên lắng nghe, không phán xét và cùng bạn tìm hướng đi." },
];

// Trang tạm — sẽ thay bằng chức năng đặt lịch tham vấn trực tuyến (có tuỳ chọn ẩn danh) ở bước sau.
export default function CounselingPage() {
  return (
    <>
      <section className="page-hero tone-lavender">
        <div className="container">
          <span className="page-hero-icon">
            <HeartHandshake size={32} aria-hidden="true" />
          </span>
          <h1>Tham vấn tâm lý</h1>
          <p className="lead">
            Gặp gỡ chuyên viên tâm lý của trường, người được đào tạo để lắng nghe và đồng hành cùng bạn. Bạn có thể chọn
            ẩn danh nếu muốn.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">Chọn hình thức phù hợp với bạn</h2>
          </div>
          <div className="option-grid">
            {OPTIONS.map(({ icon: Icon, tone, title, text, status }) => (
              <article key={title} className={`option-card tone-${tone}`}>
                <span className="topic-icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span className={`status-pill ${status === "Đang hoạt động" ? "is-live" : ""}`}>{status}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="section-head section-head-spaced">
            <h2 className="section-title">Tham vấn diễn ra như thế nào?</h2>
          </div>
          <ol className="process">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title}>
                <span className="process-num">{i + 1}</span>
                <Icon size={26} aria-hidden="true" className="process-icon" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>

          <div className="promise">
            <ShieldCheck size={28} aria-hidden="true" />
            <p>
              <strong>Cam kết bảo mật:</strong> mọi điều bạn chia sẻ được giữ bí mật. Chỉ khi bạn hoặc người khác đang gặp
              nguy hiểm, chuyên viên mới cần báo cho người lớn có trách nhiệm để bảo vệ bạn.
            </p>
          </div>

          <div className="cta-card">
            <div>
              <h2>Chưa sẵn sàng gặp chuyên viên?</h2>
              <p>Không sao cả. Bạn có thể bắt đầu bằng việc trò chuyện với {siteConfig.botName}.</p>
            </div>
            <OpenChatButton className="btn btn-primary btn-lg" message="Mình muốn biết tham vấn tâm lý ở trường diễn ra như thế nào.">
              <MessageCircleHeart size={20} aria-hidden="true" /> Trò chuyện ngay
            </OpenChatButton>
          </div>
        </div>
      </section>
    </>
  );
}
