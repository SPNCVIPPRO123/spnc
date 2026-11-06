"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarHeart, Check, HeartHandshake, Mail, MapPin, MessageCircle, Phone, X } from "lucide-react";
import { loadSent, saveSentContact } from "@/components/SurveySubmit";
import { siteConfig } from "@/lib/siteConfig";
import { CONTACT_MAX } from "@/lib/submission";
import { supportLevel } from "@/lib/supportLevel";
import type { Answers } from "@/lib/survey";

// Khung mời học sinh để lại cách liên lạc, hiện ngay sau khi gửi phiếu và xem kết quả.
// - Nhiều điểm đáng lo (mức đỏ, nhiều mức "Khá cao", cảnh báo an toàn…): nêu nhẹ nhàng các điểm nổi bật và mời để lại
//   liên lạc để chuyên viên liên hệ sớm.
// - Còn lại: lời mời nhẹ, không bắt buộc.
// Cả hai kiểu đều hiện cách liên lạc của phòng tham vấn để em tự chủ động liên hệ.
// Khi em trả lời "Có" ở câu C5, khung cảnh báo khẩn trên trang kết quả phải được thấy trước, nên khung này không tự bật lên.

const ASKED_KEY = "khao-sat-da-hoi-lien-lac";

export default function ContactPrompt({ answers, urgent }: { answers: Answers; urgent: boolean }) {
  const { high, points } = supportLevel(answers);
  const sent = loadSent();
  const [saved, setSaved] = useState(sent?.contact ?? "");
  const [editing, setEditing] = useState(!sent?.contact);
  const [value, setValue] = useState(sent?.contact ?? "");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Tự bật khung một lần cho mỗi phiếu, khi em chưa để lại liên lạc.
  useEffect(() => {
    if (!sent || sent.contact || urgent) return;
    try {
      if (sessionStorage.getItem(ASKED_KEY) === sent.id) return;
      sessionStorage.setItem(ASKED_KEY, sent.id);
    } catch {}
    const t = setTimeout(() => dialogRef.current?.showModal(), 600);
    return () => clearTimeout(t);
    // Chỉ chạy khi mở trang kết quả.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!sent) return null;

  async function submit(contact: string) {
    if (!sent) return;
    setState("sending");
    try {
      const res = await fetch("/api/khao-sat/lien-lac", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sent.id, token: sent.token, contact }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const clean = contact.trim();
      saveSentContact(clean);
      setSaved(clean);
      setValue(clean);
      setEditing(!clean);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  const close = () => dialogRef.current?.close();

  const body = (inDialog: boolean) => (
    <>
      <h3>
        <HeartHandshake size={22} aria-hidden="true" />{" "}
        {high ? "Em có muốn chuyên viên liên hệ với em không?" : "Em có muốn để lại thông tin liên lạc không?"}
      </h3>

      {high ? (
        <>
          {points.length > 0 && (
            <>
              <p>Theo câu trả lời của em, mình thấy em đang có:</p>
              <ul className="contact-points">
                {points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          )}
          <p>
            Em có muốn để lại thông tin liên lạc không? <strong>Chuyên viên tâm lý sẽ liên lạc với em sớm nhất.</strong>
          </p>
        </>
      ) : (
        <p>
          Nếu em có vấn đề gì cần chia sẻ, hãy để lại thông tin liên lạc hoặc liên hệ với chúng mình, để chúng mình biết em
          là ai và hỗ trợ em khi cần.
        </p>
      )}

      {saved && !editing ? (
        <div className="contact-saved" role="status">
          <Check size={18} aria-hidden="true" />
          <p>
            Đã ghi nhận. Chuyên viên sẽ liên lạc với em qua: <strong>{saved}</strong>
            <br />
            <button type="button" className="link-button" onClick={() => setEditing(true)}>
              Sửa
            </button>{" "}
            ·{" "}
            <button type="button" className="link-button" onClick={() => submit("")} disabled={state === "sending"}>
              Xóa liên lạc này
            </button>
          </p>
        </div>
      ) : (
        <form
          className="contact-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) submit(value);
          }}
        >
          <label className="survey-q">
            <span>Họ tên và lớp, số điện thoại, email hoặc Zalo của em</span>
            <input
              className="survey-text"
              type="text"
              maxLength={CONTACT_MAX}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Ví dụ: Lan 10A2, Zalo 09xx xxx xxx"
            />
          </label>
          {state === "error" && (
            <p className="contact-error" role="alert">
              Chưa lưu được, có thể do mạng chập chờn. Em thử lại nhé.
            </p>
          )}
          <div className="contact-buttons">
            <button type="submit" className="btn btn-primary btn-sm" disabled={state === "sending" || !value.trim()}>
              {state === "sending" ? "Đang lưu…" : "Gửi cho chuyên viên"}
            </button>
            {inDialog ? (
              <button type="button" className="btn btn-outline btn-sm" onClick={close}>
                Để sau
              </button>
            ) : (
              saved && (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                  Hủy
                </button>
              )
            )}
          </div>
        </form>
      )}

      <div className="contact-site">
        <p>
          <strong>Hoặc em chủ động liên hệ với chúng mình:</strong>
        </p>
        <ul>
          <li>
            <MapPin size={16} aria-hidden="true" /> {siteConfig.counselingRoom}
          </li>
          {siteConfig.contact.phone && (
            <li>
              <Phone size={16} aria-hidden="true" />{" "}
              <a href={`tel:${siteConfig.contact.phone.replace(/\s+/g, "")}`}>{siteConfig.contact.phone}</a>
            </li>
          )}
          {siteConfig.contact.email && (
            <li>
              <Mail size={16} aria-hidden="true" />{" "}
              <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
            </li>
          )}
          {siteConfig.contact.zalo && (
            <li>
              <MessageCircle size={16} aria-hidden="true" /> Zalo: {siteConfig.contact.zalo}
            </li>
          )}
          <li>
            <CalendarHeart size={16} aria-hidden="true" />{" "}
            <Link href={siteConfig.counselingPath}>Đặt lịch tham vấn trên web</Link>
          </li>
          <li>
            <Phone size={16} aria-hidden="true" /> Cần giúp ngay: gọi <a href="tel:111">111</a> (miễn phí, 24/7)
          </li>
        </ul>
        {siteConfig.contact.demo && (
          <p className="survey-muted small">Số điện thoại, email và Zalo ở trên là thông tin minh họa của bản thử nghiệm.</p>
        )}
      </div>
    </>
  );

  return (
    <>
      <div className={`survey-card contact-card ${high ? "is-high" : ""}`}>{body(false)}</div>
      <dialog
        ref={dialogRef}
        className={`contact-dialog ${high ? "is-high" : ""}`}
        aria-label="Để lại thông tin liên lạc"
        onClick={(e) => {
          // Bấm ra ngoài khung thì đóng.
          if (e.target === dialogRef.current) close();
        }}
      >
        <button type="button" className="contact-close" onClick={close} aria-label="Đóng">
          <X size={20} />
        </button>
        {body(true)}
      </dialog>
    </>
  );
}
