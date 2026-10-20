import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  ClipboardList,
  Clock,
  Compass,
  Gift,
  GraduationCap,
  HeartCrack,
  HeartHandshake,
  House,
  LifeBuoy,
  MessageCircleHeart,
  MoonStar,
  Phone,
  ShieldCheck,
  Smartphone,
  Sprout,
  UserX,
  Users,
} from "lucide-react";
import { OpenChatButton } from "@/components/ChatWidget";
import { LogoMark } from "@/components/Logo";
import ClientNews from "@/components/ClientNews";
import NewsCard from "@/components/NewsCard";
import { getNews, NEWS_CATEGORIES } from "@/lib/news";
import { siteConfig } from "@/lib/siteConfig";

// Trang chủ có mục "Tin tức mới" nên cũng tự cập nhật mỗi giờ.
export const revalidate = 3600;

// Nội dung trang chủ — sửa chữ ở đây là trang tự cập nhật.

const MOODS = [
  { emoji: "😄", label: "Vui vẻ", message: "Hôm nay mình thấy khá vui!" },
  { emoji: "🙂", label: "Bình thường", message: "Hôm nay mình thấy bình thường." },
  { emoji: "😔", label: "Buồn", message: "Hôm nay mình thấy buồn buồn." },
  { emoji: "😰", label: "Lo lắng", message: "Dạo này mình hay lo lắng." },
  { emoji: "😤", label: "Bực bội", message: "Hôm nay mình thấy bực bội quá." },
  { emoji: "😴", label: "Mệt mỏi", message: "Dạo này mình thấy mệt mỏi lắm." },
];

const PILLARS = [
  { icon: Brain, title: "Cảm xúc", text: "Hiểu và gọi tên cảm xúc, biết cách bình tĩnh lại khi buồn, giận hay lo âu." },
  { icon: BookOpen, title: "Học tập", text: "Đối diện áp lực thi cử, quản lý thời gian và giữ động lực học." },
  { icon: Users, title: "Các mối quan hệ", text: "Kết nối với bạn bè, thầy cô, gia đình và xử lý mâu thuẫn." },
  { icon: Sprout, title: "Phát triển bản thân", text: "Hiểu mình là ai, tự tin hơn và định hướng tương lai." },
];

const TOPICS = [
  {
    icon: GraduationCap,
    color: "sky",
    title: "Áp lực học tập, thi cử",
    text: "Ôn mãi không vào, sợ điểm kém, sợ làm bố mẹ thất vọng.",
    message: "Mình đang bị áp lực chuyện học và thi cử.",
  },
  {
    icon: UserX,
    color: "coral",
    title: "Bị trêu chọc, bắt nạt",
    text: "Bị nói xấu, cô lập hay bắt nạt trên lớp hoặc trên mạng.",
    message: "Mình đang bị bạn bè trêu chọc, cô lập.",
  },
  {
    icon: House,
    color: "sun",
    title: "Chuyện gia đình",
    text: "Bất đồng với bố mẹ, áp lực từ kỳ vọng của gia đình.",
    message: "Mình hay mâu thuẫn với bố mẹ.",
  },
  {
    icon: Users,
    color: "mint",
    title: "Tình bạn",
    text: "Giận nhau, thấy lạc lõng, khó kết bạn mới.",
    message: "Mình đang gặp chuyện buồn với bạn bè.",
  },
  {
    icon: HeartCrack,
    color: "rose",
    title: "Chuyện tình cảm",
    text: "Thích một người, chia tay, cảm xúc rối bời.",
    message: "Mình đang buồn vì chuyện tình cảm.",
  },
  {
    icon: MoonStar,
    color: "lavender",
    title: "Mất ngủ, mệt mỏi",
    text: "Khó ngủ, hay thức khuya, lúc nào cũng thấy uể oải.",
    message: "Dạo này mình khó ngủ và hay mệt mỏi.",
  },
  {
    icon: Smartphone,
    color: "sky",
    title: "Mạng xã hội & game",
    text: "Lướt mãi không dừng được, hay so sánh mình với người khác.",
    message: "Mình dùng điện thoại, mạng xã hội nhiều quá mà không dừng được.",
  },
  {
    icon: Compass,
    color: "mint",
    title: "Định hướng tương lai",
    text: "Chưa biết mình thích gì, phân vân chọn ngành, chọn trường.",
    message: "Mình chưa biết định hướng tương lai thế nào.",
  },
];

const MYTHS = [
  {
    myth: "Chỉ người “có vấn đề” mới đi tham vấn.",
    fact: "Ai cũng có lúc cần người lắng nghe. Tham vấn giúp bạn hiểu mình hơn, giống như hỏi thầy cô khi gặp bài khó.",
  },
  {
    myth: "Đi tham vấn là cả lớp sẽ biết.",
    fact: "Chuyên viên tâm lý giữ bí mật những gì bạn chia sẻ, và bạn có thể chọn tham vấn ẩn danh.",
  },
  {
    myth: "Nói ra cũng chẳng thay đổi được gì.",
    fact: "Chỉ cần nói ra là đã nhẹ lòng hơn. Chuyên viên sẽ cùng bạn tìm cách giải quyết từng bước nhỏ.",
  },
];

const FAQS = [
  {
    q: "Trò chuyện với Bạn Đồng Hành có ai đọc được không?",
    a: "Website không lưu lại cuộc trò chuyện. Tin nhắn chỉ được gửi tới hệ thống AI để tạo câu trả lời, và sẽ mất khi bạn tải lại trang hoặc bấm “Làm mới”. Bạn cũng không cần đăng nhập hay ghi tên thật.",
  },
  {
    q: "Bạn Đồng Hành có phải người thật không?",
    a: "Không, đó là trợ lý AI. AI có thể lắng nghe, giải đáp và gợi ý, nhưng không thay thế chuyên viên tâm lý. Với những chuyện quan trọng, bạn nên gặp chuyên viên của trường.",
  },
  {
    q: "Tham vấn ẩn danh là như thế nào?",
    a: "Bạn có thể trò chuyện trực tuyến với chuyên viên tâm lý mà không cần cho biết họ tên hay lớp. Chuyên viên vẫn lắng nghe và hỗ trợ bạn như bình thường.",
  },
  {
    q: "Bố mẹ, thầy cô có biết mình đi tham vấn không?",
    a: "Những gì bạn chia sẻ được giữ bí mật. Chỉ khi bạn hoặc người khác đang gặp nguy hiểm, chuyên viên mới cần báo cho người lớn có trách nhiệm để bảo vệ bạn.",
  },
  {
    q: "Khi nào mình nên gặp chuyên viên tâm lý?",
    a: "Khi cảm xúc tiêu cực kéo dài nhiều ngày, ảnh hưởng tới việc học, ăn ngủ, hoặc khi bạn thấy không tự xử lý được. Bạn không cần đợi đến lúc mọi thứ “quá tệ” mới tìm hỗ trợ.",
  },
  {
    q: "Tham vấn có mất phí không?",
    a: "Không. Tham vấn tâm lý trong trường hoàn toàn miễn phí cho học sinh.",
  },
];

export default async function HomePage() {
  const latestNews = await getNews(NEWS_CATEGORIES[0].id, 3);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <span className="blob blob-1" />
          <span className="blob blob-2" />
          <span className="blob blob-3" />
        </div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <Sprout size={16} aria-hidden="true" /> Dành cho học sinh THCS &amp; THPT
            </span>
            <h1>
              Ở đây luôn có người <span className="highlight">lắng nghe</span> bạn
            </h1>
            <p className="lead">
              Áp lực học tập, chuyện bạn bè, gia đình hay những cảm xúc khó gọi tên… Bạn không cần phải tự mình gánh hết.
              Hãy để chúng mình đồng hành cùng bạn.
            </p>
            <div className="hero-actions">
              <OpenChatButton className="btn btn-primary btn-lg">
                <MessageCircleHeart size={20} aria-hidden="true" /> Trò chuyện ngay
              </OpenChatButton>
              <Link className="btn btn-outline btn-lg" href={siteConfig.counselingPath}>
                <HeartHandshake size={20} aria-hidden="true" /> Gặp chuyên viên tâm lý
              </Link>
            </div>
            <ul className="trust-row">
              <li>
                <ShieldCheck size={18} aria-hidden="true" /> Có thể ẩn danh
              </li>
              <li>
                <Gift size={18} aria-hidden="true" /> Hoàn toàn miễn phí
              </li>
              <li>
                <Clock size={18} aria-hidden="true" /> Trợ lý AI 24/7
              </li>
            </ul>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="mock-chat">
              <div className="mock-chat-header">
                <LogoMark size={36} />
                <div>
                  <strong>{siteConfig.botName}</strong>
                  <small>
                    <span className="dot" /> Đang lắng nghe
                  </small>
                </div>
              </div>
              <div className="mock-chat-body">
                <p className="mock-bubble user">Sắp thi rồi mà mình chẳng học vào được gì, lo quá 😣</p>
                <p className="mock-bubble bot">
                  Nghe bạn đang áp lực lắm. Cảm giác đó rất dễ hiểu khi kỳ thi đến gần. Bạn đang lo nhất môn nào?
                </p>
                <p className="mock-bubble user">Môn Toán, mình sợ bị điểm kém…</p>
                <p className="mock-bubble bot typing-mock">
                  <span />
                  <span />
                  <span />
                </p>
              </div>
            </div>
            <div className="float-badge badge-1">
              <ShieldCheck size={18} /> Ẩn danh
            </div>
            <div className="float-badge badge-2">💛 Không phán xét</div>
          </div>
        </div>
      </section>

      {/* ---------- Check-in tâm trạng ---------- */}
      <section className="container">
        <div className="mood-card">
          <div>
            <h2>Hôm nay bạn thấy thế nào?</h2>
            <p>Chọn một cảm xúc, {siteConfig.botName} sẽ trò chuyện cùng bạn.</p>
          </div>
          <div className="mood-list">
            {MOODS.map((m) => (
              <OpenChatButton key={m.label} className="mood-btn" message={m.message}>
                <span className="mood-emoji" aria-hidden="true">
                  {m.emoji}
                </span>
                {m.label}
              </OpenChatButton>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Tâm lý học đường là gì ---------- */}
      <section id="tim-hieu" className="section">
        <div className="container about-grid">
          <div>
            <span className="section-tag">Tìm hiểu</span>
            <h2 className="section-title">Tâm lý học đường là gì?</h2>
            <p>
              Tâm lý học đường quan tâm tới <strong>sức khỏe tinh thần của học sinh</strong> trong môi trường học tập: cảm
              xúc, các mối quan hệ với bạn bè, thầy cô, gia đình, áp lực học hành và quá trình lớn lên của mỗi người.
            </p>
            <p>
              Ở trường, <strong>chuyên viên tâm lý</strong> là người được đào tạo để lắng nghe, giữ bí mật và cùng bạn tìm
              cách vượt qua khó khăn. Tìm đến họ không có nghĩa là bạn “có vấn đề”, mà là bạn đang chăm sóc bản thân.
            </p>
            <OpenChatButton className="btn btn-soft" message="Tâm lý học đường là gì? Chuyên viên tâm lý ở trường làm gì?">
              Hỏi thêm {siteConfig.botName} <ArrowRight size={18} aria-hidden="true" />
            </OpenChatButton>
          </div>
          <div className="pillar-grid">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <div className="pillar" key={title}>
                <span className="pillar-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Chủ đề ---------- */}
      <section id="chu-de" className="section section-tinted">
        <div className="container">
          <div className="section-head">
            <span className="section-tag">Chủ đề</span>
            <h2 className="section-title">Bạn có đang gặp những điều này?</h2>
            <p>Bạn không phải người duy nhất. Chọn một chủ đề để bắt đầu trò chuyện.</p>
          </div>
          <div className="topic-grid">
            {TOPICS.map(({ icon: Icon, color, title, text, message }) => (
              <OpenChatButton key={title} className={`topic-card tone-${color}`} message={message}>
                <span className="topic-icon">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <strong>{title}</strong>
                <span className="topic-text">{text}</span>
                <span className="topic-link">
                  Trò chuyện <ArrowRight size={16} aria-hidden="true" />
                </span>
              </OpenChatButton>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- 3 cách hỗ trợ ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="section-tag">Hỗ trợ</span>
            <h2 className="section-title">3 cách để bạn được hỗ trợ</h2>
            <p>Bắt đầu từ bước nào cũng được, miễn là bạn thấy thoải mái.</p>
          </div>
          <div className="steps">
            <article className="step tone-mint">
              <span className="step-num">1</span>
              <span className="step-icon">
                <MessageCircleHeart size={28} aria-hidden="true" />
              </span>
              <h3>Trò chuyện với {siteConfig.botName}</h3>
              <p>Trợ lý AI trả lời ngay, mọi lúc. Phù hợp khi bạn muốn tìm hiểu hoặc cần ai đó lắng nghe.</p>
              <OpenChatButton className="btn btn-primary">Bắt đầu trò chuyện</OpenChatButton>
            </article>
            <article className="step tone-sun">
              <span className="step-num">2</span>
              <span className="step-icon">
                <ClipboardList size={28} aria-hidden="true" />
              </span>
              <h3>Làm khảo sát nhanh</h3>
              <p>Vài phút trả lời câu hỏi ngắn để nhìn lại tâm trạng của bạn trong thời gian gần đây.</p>
              <Link className="btn btn-outline" href={siteConfig.surveyPath}>
                Làm khảo sát
              </Link>
            </article>
            <article className="step tone-lavender">
              <span className="step-num">3</span>
              <span className="step-icon">
                <HeartHandshake size={28} aria-hidden="true" />
              </span>
              <h3>Tham vấn với chuyên viên</h3>
              <p>Trò chuyện trực tuyến với chuyên viên tâm lý của trường. Bạn có thể chọn ẩn danh.</p>
              <Link className="btn btn-outline" href={siteConfig.counselingPath}>
                Đặt lịch tham vấn
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- Hiểu đúng ---------- */}
      <section className="section section-tinted">
        <div className="container">
          <div className="section-head">
            <span className="section-tag">Hiểu đúng</span>
            <h2 className="section-title">Những hiểu lầm thường gặp về tham vấn tâm lý</h2>
          </div>
          <div className="myth-grid">
            {MYTHS.map((m) => (
              <article className="myth-card" key={m.myth}>
                <p className="myth">
                  <span className="myth-label wrong">Hiểu lầm</span>
                  {m.myth}
                </p>
                <p className="fact">
                  <span className="myth-label right">Sự thật</span>
                  {m.fact}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Tin tức mới ---------- */}
      <section className="section">
        <div className="container">
          <div className="section-head-row">
            <div>
              <span className="section-tag">Tin tức</span>
              <h2 className="section-title">Tin mới về tâm lý học đường</h2>
            </div>
            <Link className="btn btn-soft" href="/tin-tuc">
              Xem tất cả tin tức <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          {latestNews && latestNews.length > 0 ? (
            <div className="news-grid">
              {latestNews.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <ClientNews categoryId={NEWS_CATEGORIES[0].id} limit={3} />
          )}
        </div>
      </section>

      {/* ---------- Hỏi đáp ---------- */}
      <section id="hoi-dap" className="section section-tinted">
        <div className="container faq-grid">
          <div>
            <span className="section-tag">Hỏi đáp</span>
            <h2 className="section-title">Bạn thắc mắc?</h2>
            <p>Những câu hỏi học sinh hay gửi tới phòng tâm lý. Không thấy câu bạn cần? Hỏi {siteConfig.botName} nhé.</p>
            <OpenChatButton className="btn btn-soft">
              Đặt câu hỏi khác <ArrowRight size={18} aria-hidden="true" />
            </OpenChatButton>
          </div>
          <div className="faq-list">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Khẩn cấp ---------- */}
      <section className="container">
        <div className="sos-band">
          <span className="sos-icon">
            <LifeBuoy size={32} aria-hidden="true" />
          </span>
          <div className="sos-text">
            <h2>Nếu bạn đang gặp nguy hiểm ngay lúc này</h2>
            <p>Đừng chờ đợi. Hãy gọi ngay hoặc nói với một người lớn bạn tin tưởng ở gần bạn.</p>
          </div>
          <div className="sos-numbers">
            {siteConfig.hotlines.map((h) => (
              <a key={h.number} href={`tel:${h.number}`} className="sos-number">
                <Phone size={18} aria-hidden="true" />
                <strong>{h.number}</strong>
                <small>{h.label}</small>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
