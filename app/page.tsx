import Link from "next/link";
import { OpenChatButton } from "@/components/ChatWidget";
import { siteConfig } from "@/lib/siteConfig";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>Ở đây luôn có người lắng nghe bạn</h1>
        <p>
          Áp lực học tập, chuyện bạn bè, gia đình hay những cảm xúc khó gọi tên… Bạn không cần phải tự mình gánh hết.
        </p>
        <div className="hero-actions">
          <OpenChatButton className="btn btn-primary">💬 Trò chuyện với {siteConfig.botName}</OpenChatButton>
          <Link className="btn" href={siteConfig.surveyPath}>
            📝 Khảo sát nhanh
          </Link>
          <Link className="btn" href={siteConfig.counselingPath}>
            🤝 Tham vấn ẩn danh
          </Link>
        </div>
      </section>

      <section id="tim-hieu" className="section">
        <h2>Tâm lý học đường là gì?</h2>
        <p>
          Tâm lý học đường là lĩnh vực quan tâm tới sức khoẻ tinh thần của học sinh trong môi trường học tập: cảm xúc,
          các mối quan hệ với bạn bè, thầy cô, gia đình, áp lực học hành và quá trình lớn lên của mỗi người. Ở trường,
          chuyên viên tâm lý (hay giáo viên tư vấn tâm lý) là người được đào tạo để lắng nghe và cùng bạn tìm cách vượt
          qua khó khăn.
        </p>
        <p>
          Tìm đến tham vấn tâm lý <strong>không có nghĩa là bạn &quot;có vấn đề&quot;</strong>. Cũng giống như hỏi thầy
          cô khi gặp bài khó, đó là cách để bạn được hỗ trợ kịp thời.
        </p>

        <h3>Khi nào bạn nên tìm sự hỗ trợ?</h3>
        <ul className="check-list">
          <li>Buồn bã, lo lắng, căng thẳng kéo dài nhiều ngày liền</li>
          <li>Khó ngủ, chán ăn, không còn hứng thú với những việc trước đây thích</li>
          <li>Kết quả học tập giảm sút, khó tập trung</li>
          <li>Bị trêu chọc, cô lập, bắt nạt (kể cả trên mạng)</li>
          <li>Mâu thuẫn với bố mẹ, bạn bè mà không biết chia sẻ cùng ai</li>
        </ul>
      </section>

      <section className="section cards">
        <article className="card">
          <h3>📝 Khảo sát nhanh</h3>
          <p>Vài câu hỏi ngắn giúp bạn nhìn lại tâm trạng của mình thời gian gần đây.</p>
          <Link href={siteConfig.surveyPath}>Làm khảo sát →</Link>
        </article>
        <article className="card">
          <h3>🤝 Tham vấn trực tuyến</h3>
          <p>Trò chuyện với chuyên viên tâm lý của trường. Bạn có thể chọn ẩn danh nếu muốn.</p>
          <Link href={siteConfig.counselingPath}>Đặt lịch tham vấn →</Link>
        </article>
        <article className="card">
          <h3>💬 Trợ lý {siteConfig.botName}</h3>
          <p>Trợ lý AI giải đáp thắc mắc và lắng nghe bạn bất cứ lúc nào, không cần đăng nhập.</p>
          <OpenChatButton className="link-button">Bắt đầu trò chuyện →</OpenChatButton>
        </article>
      </section>
    </>
  );
}
