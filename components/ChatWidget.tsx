"use client";

import { FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { detectCrisis } from "@/lib/safety";
import { siteConfig } from "@/lib/siteConfig";

type Message = { role: "user" | "assistant"; content: string };

const OPEN_CHAT_EVENT = "open-chat";

const WELCOME: Message = {
  role: "assistant",
  content: `Chào bạn, mình là ${siteConfig.botName} 👋 Mình ở đây để lắng nghe và cùng bạn tìm hiểu về tâm lý học đường. Bạn đang nghĩ gì, cứ chia sẻ với mình nhé.`,
};

const SUGGESTIONS = [
  "Tâm lý học đường là gì?",
  "Dạo này mình áp lực chuyện học quá",
  "Mình có thể gặp chuyên viên tâm lý ẩn danh không?",
  "Mình hay bị bạn bè trêu chọc",
];

// Nút mở khung chat, dùng được ở bất kỳ trang nào.
export function OpenChatButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}>
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
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, handler);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

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
      <button type="button" className="chat-fab" onClick={() => setOpen(true)} aria-label="Mở khung trò chuyện">
        💬 <span>Trò chuyện</span>
      </button>
    );
  }

  return (
    <section className="chat-panel" aria-label={`Trò chuyện với ${siteConfig.botName}`}>
      <header className="chat-header">
        <div>
          <strong>{siteConfig.botName}</strong>
          <small>Trợ lý AI · không lưu cuộc trò chuyện</small>
        </div>
        <div className="chat-header-actions">
          <button type="button" onClick={reset} title="Bắt đầu cuộc trò chuyện mới">
            Làm mới
          </button>
          <button type="button" onClick={() => setOpen(false)} aria-label="Đóng">
            ✕
          </button>
        </div>
      </header>

      {showCrisis && (
        <div className="crisis-banner" role="alert">
          <strong>Bạn không đơn độc.</strong> Nếu bạn đang gặp nguy hiểm hoặc có ý định làm hại bản thân, hãy liên hệ ngay:
          <ul>
            {siteConfig.hotlines.map((h) => (
              <li key={h.number}>
                <a href={`tel:${h.number}`}>{h.number}</a> – {h.label}
              </li>
            ))}
          </ul>
          Hoặc tìm ngay thầy cô, bố mẹ, hay <a href={siteConfig.counselingPath}>chuyên viên tâm lý của trường</a>.
        </div>
      )}

      <div className="chat-messages" ref={listRef} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.content || (loading && i === messages.length - 1 ? <span className="typing">Đang trả lời…</span> : null)}
          </div>
        ))}
        {messages.length === 1 && (
          <div className="chat-suggestions">
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nhập tin nhắn… (không cần ghi tên thật)"
          rows={2}
          maxLength={2000}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Gửi
        </button>
      </form>
      <p className="chat-disclaimer">
        {siteConfig.botName} là AI, chỉ hỗ trợ ban đầu và không thay thế chuyên viên tâm lý.
      </p>
    </section>
  );
}
