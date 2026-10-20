"use client";

import { FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Lock, MessageCircleHeart, Phone, RotateCcw, Send, X } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { detectCrisis } from "@/lib/safety";
import { siteConfig } from "@/lib/siteConfig";

type Message = { role: "user" | "assistant"; content: string };

const OPEN_CHAT_EVENT = "open-chat";

const WELCOME: Message = {
  role: "assistant",
  content: `Chào bạn 👋 Mình là ${siteConfig.botName}, trợ lý AI của phòng tâm lý học đường. Bạn có thể kể với mình bất cứ điều gì đang làm bạn bận lòng, hoặc hỏi về tâm lý học đường nhé.`,
};

const SUGGESTIONS = [
  "Tâm lý học đường là gì?",
  "Dạo này mình áp lực chuyện học quá",
  "Mình có thể gặp chuyên viên tâm lý ẩn danh không?",
  "Mình hay bị bạn bè trêu chọc",
];

// Nút mở khung chat, dùng được ở bất kỳ trang nào.
// Nếu truyền `message`, khung chat sẽ mở ra và tự gửi tin nhắn đó.
export function OpenChatButton({
  children,
  className,
  message,
}: {
  children: ReactNode;
  className?: string;
  message?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT, { detail: { message } }))}
    >
      {children}
    </button>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      setOpen(true);
      const message = (e as CustomEvent<{ message?: string }>).detail?.message;
      if (message) setPending(message);
    };
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, []);

  // Gửi tin nhắn được truyền từ nút bên ngoài (chọn tâm trạng, chọn chủ đề…).
  useEffect(() => {
    if (pending && !loading) {
      setPending(null);
      send(pending);
    }
  }, [pending, loading]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, showCrisis]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    if (detectCrisis(content)) setShowCrisis(true);

    const history: Message[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const appendToReply = (chunk: string) =>
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = { ...last, content: last.content + chunk };
        return next;
      });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Lời chào ban đầu chỉ hiển thị trên giao diện, không gửi cho AI.
        body: JSON.stringify({ messages: history.slice(1) }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        appendToReply((await res.text()) || "Có lỗi xảy ra, bạn thử lại nhé.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToReply(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        appendToReply("Mất kết nối mạng, bạn kiểm tra lại rồi thử lại nhé.");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([WELCOME]);
    setShowCrisis(false);
  }

  if (!open) {
    return (
      <button type="button" className="chat-launcher" onClick={() => setOpen(true)} aria-label="Mở khung trò chuyện">
        <span className="chat-launcher-icon">
          <MessageCircleHeart size={24} aria-hidden="true" />
        </span>
        <span className="chat-launcher-text">
          <strong>Cần người lắng nghe?</strong>
          <small>Trò chuyện với {siteConfig.botName}</small>
        </span>
      </button>
    );
  }

  return (
    <section className="chat-panel" aria-label={`Trò chuyện với ${siteConfig.botName}`}>
      <header className="chat-header">
        <div className="chat-avatar">
          <LogoMark size={40} />
          <span className="online-dot" aria-hidden="true" />
        </div>
        <div className="chat-title">
          <strong>{siteConfig.botName}</strong>
          <small>Trợ lý AI · luôn sẵn sàng lắng nghe</small>
        </div>
        <button type="button" className="icon-btn" onClick={reset} title="Bắt đầu cuộc trò chuyện mới" aria-label="Làm mới">
          <RotateCcw size={18} />
        </button>
        <button type="button" className="icon-btn" onClick={() => setOpen(false)} title="Thu nhỏ" aria-label="Đóng">
          <X size={20} />
        </button>
      </header>

      <div className="chat-privacy">
        <Lock size={13} aria-hidden="true" /> Không lưu cuộc trò chuyện · Không cần ghi tên thật
      </div>

      <div className="chat-messages" ref={listRef} aria-live="polite">
        {showCrisis && (
          <div className="crisis-card" role="alert">
            <strong>Bạn không đơn độc 💛</strong>
            <p>Nếu bạn đang gặp nguy hiểm hoặc có ý định làm hại bản thân, hãy gọi ngay:</p>
            <div className="crisis-numbers">
              {siteConfig.hotlines.map((h) => (
                <a key={h.number} href={`tel:${h.number}`} title={h.label}>
                  <Phone size={14} aria-hidden="true" /> {h.number}
                </a>
              ))}
            </div>
            <p>
              Hoặc nói ngay với thầy cô, bố mẹ, hay <a href={siteConfig.counselingPath}>chuyên viên tâm lý của trường</a>.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`chat-row ${m.role}`}>
            {m.role === "assistant" && (
              <span className="chat-row-avatar" aria-hidden="true">
                <LogoMark size={28} />
              </span>
            )}
            <div className={`chat-bubble ${m.role}`}>
              {m.content ||
                (loading && i === messages.length - 1 ? (
                  <span className="typing" aria-label="Đang trả lời">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : null)}
            </div>
          </div>
        ))}

        {messages.length === 1 && (
          <div className="chat-suggestions">
            <span>Gợi ý cho bạn:</span>
            {SUGGESTIONS.map((s) => (
              <button type="button" key={s} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="chat-input" onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nhập điều bạn muốn chia sẻ…"
          rows={1}
          maxLength={2000}
          aria-label="Tin nhắn"
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Gửi">
          <Send size={18} />
        </button>
      </form>
      <p className="chat-disclaimer">
        {siteConfig.botName} là AI, chỉ hỗ trợ ban đầu và không thay thế chuyên viên tâm lý.
      </p>
    </section>
  );
}
