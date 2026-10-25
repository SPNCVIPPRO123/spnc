"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";
import { CONTACT_MAX, wantsContact } from "@/lib/submission";
import type { Answers } from "@/lib/survey";

// Bước cuối của phiếu: gửi câu trả lời tới chuyên viên tư vấn của trường (lưu ở máy chủ, xem tại /chuyen-vien).
// Mã phiếu và mã sửa được giữ tạm trong tab để nếu em "Xem lại câu trả lời" rồi gửi lại thì phiếu cũ được cập nhật.

const SENT_KEY = "khao-sat-da-gui-v1";

type Sent = { id: string; token: string; contact: string };

export function loadSent(): Sent | null {
  try {
    const raw = sessionStorage.getItem(SENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSent() {
  try {
    sessionStorage.removeItem(SENT_KEY);
  } catch {}
}

export default function SurveySubmit({
  answers,
  nickname,
  onBack,
  onDone,
}: {
  answers: Answers;
  nickname?: string;
  onBack: () => void;
  onDone: (sent: boolean) => void;
}) {
  const previous = loadSent();
  const askContact = wantsContact(answers);
  const [contact, setContact] = useState(previous?.contact ?? "");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");

  async function send() {
    setState("sending");
    try {
      const res = await fetch("/api/khao-sat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          contact: askContact ? contact : undefined,
          id: previous?.id,
          token: previous?.token,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { id, token } = await res.json();
      try {
        sessionStorage.setItem(SENT_KEY, JSON.stringify({ id, token, contact: askContact ? contact : "" }));
      } catch {}
      onDone(true);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="survey-card survey-submit">
      <h2 className="survey-section-title">{previous ? "Gửi lại phiếu đã sửa" : "Gửi phiếu"}</h2>
      <p>
        Em đã trả lời xong. Khi bấm gửi, câu trả lời được chuyển tới <strong>chuyên viên tư vấn tâm lý của trường</strong>{" "}
        để hỗ trợ em khi cần. Bạn bè, bố mẹ hay thầy cô khác không xem được phiếu này.
        {previous && " Phiếu em gửi lúc trước sẽ được thay bằng câu trả lời mới."}
      </p>

      {askContact ? (
        <label className="survey-q">
          <span>
            Em muốn chuyên viên liên lạc với em qua đâu? (ví dụ: họ tên và lớp, số điện thoại, email hoặc Zalo)
          </span>
          <input
            className="survey-text"
            type="text"
            maxLength={CONTACT_MAX}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Em ghi ở đây (không bắt buộc)"
          />
        </label>
      ) : (
        <p className="survey-muted">
          Em đã chọn ẩn danh hoàn toàn, nên phiếu không kèm họ tên hay cách liên lạc của em. Nếu muốn được liên hệ, em
          có thể quay lại Phần 1 và đổi câu cuối.
        </p>
      )}

      {nickname ? (
        <p className="survey-muted">
          Phiếu được lưu vào tài khoản của em để em xem lại kết quả sau này. Chuyên viên sẽ thấy phiếu kèm biệt danh{" "}
          <strong>{nickname}</strong> (không phải tên thật).
        </p>
      ) : (
        <p className="survey-muted">
          Muốn lưu kết quả để xem lại sau?{" "}
          <Link href="/dang-nhap?next=/khao-sat">Đăng nhập hoặc tạo tài khoản bằng biệt danh</Link> trước khi gửi (câu
          trả lời của em vẫn được giữ).
        </p>
      )}

      {state === "error" && (
        <div className="survey-support" role="alert">
          <p>
            Chưa gửi được phiếu (có thể do mạng). Em thử gửi lại nhé. Nếu vẫn không được, em vẫn xem được kết quả và có
            thể in mang tới phòng tư vấn ({siteConfig.counselingRoom}).
          </p>
        </div>
      )}

      <div className="survey-nav">
        <button type="button" className="btn btn-outline" onClick={onBack} disabled={state === "sending"}>
          <ArrowLeft size={18} aria-hidden="true" /> Quay lại
        </button>
        <div className="survey-submit-buttons">
          {state === "error" && (
            <button type="button" className="btn btn-outline" onClick={() => onDone(false)}>
              Xem kết quả, chưa gửi
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={send} disabled={state === "sending"}>
            {state === "sending" ? "Đang gửi…" : state === "error" ? "Thử gửi lại" : "Gửi phiếu và xem kết quả"}{" "}
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
