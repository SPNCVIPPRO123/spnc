"use client";

import Link from "next/link";
import {
  HeartHandshake,
  LifeBuoy,
  MessageCircleHeart,
  Pencil,
  Phone,
  Printer,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Sprout,
} from "lucide-react";
import { OpenChatButton } from "@/components/ChatWidget";
import { siteConfig } from "@/lib/siteConfig";
import {
  DASS_INFO,
  LEVEL_LABELS,
  lifeEvents,
  protectionConcern,
  safetyConcern,
  scoreDass,
  strengths,
  worries,
  type Answers,
  type DassKey,
} from "@/lib/survey";

const TIPS: Record<DassKey, string[]> = {
  depression: [
    "Chia ngày thành những việc nhỏ, làm xong một việc là tự khen mình.",
    "Ra ngoài trời, vận động nhẹ 15–20 phút mỗi ngày.",
    "Nhắn tin hoặc gặp một người bạn tin tưởng, đừng ở một mình quá lâu.",
  ],
  anxiety: [
    "Thử thở chậm: hít vào 4 nhịp, giữ 4 nhịp, thở ra 6 nhịp, lặp lại vài lần.",
    "Viết ra điều đang lo, rồi tách thành việc mình làm được và việc ngoài tầm tay.",
    "Hạn chế cà phê, trà sữa và lướt mạng khuya.",
  ],
  stress: [
    "Lên lịch học có giờ nghỉ, ưu tiên ngủ đủ 8 tiếng.",
    "Dành thời gian cho một sở thích giúp bạn thư giãn mỗi ngày.",
    "Nói ra với ai đó khi thấy quá tải, bạn không cần gánh một mình.",
  ],
};

function chatMessage(maxKey: DassKey | null, maxLevel: number, safety: boolean): string {
  if (safety) return "Mình vừa làm khảo sát nhanh và có lúc mình nghĩ đến chuyện không muốn sống nữa.";
  if (!maxKey || maxLevel === 0)
    return "Mình vừa làm khảo sát nhanh, kết quả khá ổn. Mình muốn biết cách giữ tinh thần tốt.";
  return `Mình vừa làm khảo sát nhanh, kết quả cho thấy mức ${DASS_INFO[maxKey].name.toLowerCase()} của mình đang ${LEVEL_LABELS[
    maxLevel
  ].toLowerCase()}. Mình nên làm gì để thấy khá hơn?`;
}

export default function SurveyResults({
  answers,
  sent,
  onEdit,
  onRestart,
}: {
  answers: Answers;
  sent: boolean;
  onEdit: () => void;
  onRestart: () => void;
}) {
  const dass = scoreDass(answers);
  const safety = safetyConcern(answers);
  const protection = protectionConcern(answers);
  const worryList = worries(answers);
  const strengthList = strengths(answers);
  const events = lifeEvents(answers);
  const wantsContact = answers["A6"]?.toString().startsWith("Để lại");

  const keys = Object.keys(dass) as DassKey[];
  const maxLevel = Math.max(...keys.map((k) => dass[k].level));
  const maxKey = maxLevel > 0 ? keys.reduce((a, b) => (dass[b].level > dass[a].level ? b : a)) : null;
  const elevated = keys.filter((k) => dass[k].level > 0);
  const today = new Date().toLocaleDateString("vi-VN");

  return (
    <div className="survey-results">
      <div className="survey-card results-head">
        <span className="page-hero-icon small">
          <Sparkles size={26} aria-hidden="true" />
        </span>
        <h2>Cảm ơn em đã hoàn thành phiếu!</h2>
        <p>
          Dưới đây là kết quả dựa trên câu trả lời của em. Đây là kết quả <strong>sàng lọc ban đầu</strong>, không phải
          chẩn đoán. Chỉ chuyên viên tâm lý mới có thể đánh giá đầy đủ.
        </p>
        <p className="survey-muted small print-only">Ngày làm khảo sát: {today}</p>
      </div>

      {safety.flagged && (
        <div className={`result-alert ${safety.urgent ? "is-urgent" : ""}`} role="alert">
          <LifeBuoy size={30} aria-hidden="true" />
          <div>
            <h3>{safety.urgent ? "Hãy tìm người giúp đỡ ngay bây giờ" : "Em không phải chịu đựng một mình"}</h3>
            <p>
              Cảm ơn em đã trả lời thật lòng. Những suy nghĩ nặng nề như vậy có thể vượt qua được khi có người đồng hành.
              {safety.urgent
                ? " Ngay lúc này, hãy đến chỗ có người lớn và gọi một trong các số dưới đây."
                : " Hãy nói với thầy cô, chuyên viên tư vấn hoặc một người lớn em tin tưởng trong hôm nay."}
            </p>
            <div className="result-hotlines">
              {siteConfig.hotlines.map((h) => (
                <a key={h.number} href={`tel:${h.number}`}>
                  <Phone size={16} aria-hidden="true" /> <b>{h.number}</b> <span>{h.label}</span>
                </a>
              ))}
            </div>
            <p className="small">Phòng tư vấn của trường: {siteConfig.counselingRoom}</p>
          </div>
        </div>
      )}

      {protection && (
        <div className="result-alert is-protect" role="alert">
          <ShieldAlert size={30} aria-hidden="true" />
          <div>
            <h3>Không ai được phép làm tổn thương em</h3>
            <p>
              Một số câu trả lời cho thấy có thể em đang bị đối xử không đúng (bị đánh, mắng chửi, đe dọa, ép buộc hay
              đụng chạm khiến em sợ hãi). Đó không phải lỗi của em. Hãy kể với một người lớn em tin tưởng hoặc gọi{" "}
              <a href="tel:111">111</a> (miễn phí, 24/7).
            </p>
          </div>
        </div>
      )}

      <div className="survey-card">
        <h3 className="results-title">Cảm xúc của em trong 7 ngày qua</h3>
        <div className="dass-grid">
          {keys.map((k) => (
            <div className={`dass-item level-${dass[k].level}`} key={k}>
              <div className="dass-top">
                <strong>{DASS_INFO[k].name}</strong>
                <span className="dass-badge">{LEVEL_LABELS[dass[k].level]}</span>
              </div>
              <div className="dass-meter" aria-hidden="true">
                {LEVEL_LABELS.map((_, i) => (
                  <span key={i} className={i <= dass[k].level ? "on" : undefined} />
                ))}
              </div>
              <p>Nói về {DASS_INFO[k].desc}.</p>
            </div>
          ))}
        </div>
        <p className="survey-muted small">
          Tính theo thang DASS-21 (Lovibond &amp; Lovibond, 1995). Mức độ: {LEVEL_LABELS.join(" → ")}.
        </p>
      </div>

      <div className={`survey-card result-advice level-${Math.min(maxLevel, 4)}`}>
        {maxLevel >= 2 ? (
          <>
            <h3>
              <HeartHandshake size={22} aria-hidden="true" /> Em nên gặp chuyên viên tâm lý
            </h3>
            <p>
              Kết quả cho thấy em đang mang nhiều cảm xúc nặng nề. Trò chuyện với chuyên viên tâm lý của trường sẽ giúp
              em nhẹ lòng hơn và tìm được cách vượt qua. Em có thể chọn tham vấn ẩn danh.
            </p>
          </>
        ) : maxLevel === 1 ? (
          <>
            <h3>
              <Sprout size={22} aria-hidden="true" /> Hãy chăm sóc bản thân nhiều hơn một chút
            </h3>
            <p>Một vài cảm xúc của em đang hơi cao. Thử những gợi ý dưới đây, và đừng ngại tìm người trò chuyện nhé.</p>
          </>
        ) : (
          <>
            <h3>
              <Sprout size={22} aria-hidden="true" /> Em đang khá ổn
            </h3>
            <p>Cảm xúc của em trong tuần qua khá cân bằng. Hãy tiếp tục giữ những thói quen tốt và những điểm tựa của mình.</p>
          </>
        )}
        {elevated.length > 0 && (
          <div className="tips-grid">
            {elevated.map((k) => (
              <div key={k}>
                <strong>Khi thấy {DASS_INFO[k].name.toLowerCase()}:</strong>
                <ul>
                  {TIPS[k].map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {worryList.length > 0 && (
        <div className="survey-card">
          <h3 className="results-title">Những điều đang làm em bận lòng</h3>
          <p className="survey-muted">Những điều em cho biết xảy ra thường xuyên trong khoảng 1 tháng qua:</p>
          <div className="worry-grid">
            {worryList.map((w) => (
              <div key={w.area} className="worry-item">
                <strong>{w.area}</strong>
                <ul>
                  {w.items.slice(0, 4).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="survey-card">
        <h3 className="results-title">Những điểm tựa của em</h3>
        {strengthList.length > 0 ? (
          <ul className="strength-list">
            {strengthList.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : (
          <p>
            Có vẻ em đang thiếu người để chia sẻ. Hãy thử bắt đầu với một người bạn, một thầy cô, hoặc trò chuyện với{" "}
            {siteConfig.botName}. Em xứng đáng được lắng nghe.
          </p>
        )}
        {events.length > 0 && (
          <p className="survey-muted">
            Em đã trải qua {events.length} thay đổi lớn trong năm qua ({events.join("; ").toLowerCase()}). Những biến cố
            như vậy có thể ảnh hưởng tới cảm xúc trong thời gian dài, nên em hãy nhẹ nhàng với bản thân.
          </p>
        )}
      </div>

      <div className="survey-card result-note">
        {sent ? (
          <p>
            Phiếu của em <strong>đã được gửi tới chuyên viên tư vấn của trường</strong>.
            {wantsContact
              ? " Nếu em đã ghi cách liên lạc, chuyên viên có thể liên hệ với em khi cần."
              : " Em đã chọn ẩn danh, nên nếu muốn được hỗ trợ riêng, em hãy chủ động tới phòng tư vấn hoặc đặt lịch tham vấn."}
          </p>
        ) : (
          <p>
            Phiếu của em <strong>chưa được gửi</strong> tới chuyên viên. Em hãy <strong>in kết quả này</strong> mang tới
            phòng tư vấn ({siteConfig.counselingRoom}) hoặc bấm “Xem lại câu trả lời” để thử gửi lại.
          </p>
        )}
      </div>

      <div className="survey-card results-actions">
        <h3 className="results-title">Bước tiếp theo</h3>
        <div className="results-buttons">
          <Link className="btn btn-primary" href={siteConfig.counselingPath}>
            <HeartHandshake size={18} aria-hidden="true" /> Đặt lịch tham vấn
          </Link>
          <OpenChatButton className="btn btn-soft" message={chatMessage(maxKey, maxLevel, safety.flagged)}>
            <MessageCircleHeart size={18} aria-hidden="true" /> Kể với {siteConfig.botName}
          </OpenChatButton>
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={18} aria-hidden="true" /> In / lưu kết quả
          </button>
        </div>
        <div className="results-secondary">
          <button type="button" className="link-button" onClick={onEdit}>
            <Pencil size={15} aria-hidden="true" /> Xem lại câu trả lời
          </button>
          <button type="button" className="link-button" onClick={onRestart}>
            <RotateCcw size={15} aria-hidden="true" /> Xóa câu trả lời và làm lại
          </button>
        </div>
        <p className="survey-muted small">
          Trên máy này, câu trả lời chỉ được lưu tạm và tự xóa khi em đóng tab. Nếu dùng máy chung, hãy bấm “Xóa câu trả
          lời” khi xong (phiếu đã gửi cho chuyên viên vẫn được giữ).
        </p>
      </div>
    </div>
  );
}
