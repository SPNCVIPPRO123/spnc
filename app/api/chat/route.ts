import Anthropic from "@anthropic-ai/sdk";
import { detectCrisis } from "@/lib/safety";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

export const runtime = "nodejs";

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

// Giới hạn để tránh bị lạm dụng (mỗi lượt gọi AI đều tốn tiền).
const MAX_HISTORY = 20; // số tin nhắn gần nhất gửi cho AI
const MAX_CHARS = 2000; // độ dài tối đa của một tin nhắn
const RATE_LIMIT = 15; // số tin nhắn tối đa…
const RATE_WINDOW_MS = 60_000; // …trong 1 phút, cho mỗi địa chỉ IP

const ERROR_TEXT =
  "Xin lỗi bạn, mình đang gặp trục trặc kỹ thuật nên chưa trả lời được. Bạn thử lại sau ít phút nhé. Nếu bạn đang cần hỗ trợ gấp, hãy gọi 111 (miễn phí, 24/7) hoặc tìm thầy cô, chuyên viên tâm lý của trường.";
const REFUSAL_TEXT =
  "Mình chưa thể trả lời câu này. Nếu bạn đang có chuyện khó nói, chuyên viên tâm lý của trường luôn sẵn sàng lắng nghe, và bạn có thể chọn tham vấn ẩn danh.";

// Nhắc thêm cho AI khi tin nhắn có dấu hiệu khủng hoảng.
const CRISIS_REMINDER =
  "Tin nhắn vừa rồi có thể chứa dấu hiệu khủng hoảng (tự hại, tự tử, bạo hành hoặc nguy hiểm). Hãy áp dụng mục 'Tình huống khẩn cấp' trong hướng dẫn.";

// API key được SDK tự đọc từ biến môi trường ANTHROPIC_API_KEY.
const client = new Anthropic();

// Bộ đếm đơn giản trong bộ nhớ. Khi triển khai thật trên nhiều máy chủ nên dùng Redis/Upstash.
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (requestLog.size > 5000) {
    for (const [key, times] of requestLog) {
      if (now - times[times.length - 1] >= RATE_WINDOW_MS) requestLog.delete(key);
    }
  }
  const recent = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

// Kiểm tra dữ liệu trình duyệt gửi lên, chỉ giữ lại những tin nhắn hợp lệ.
function parseMessages(body: unknown): Anthropic.Beta.BetaMessageParam[] | null {
  if (typeof body !== "object" || body === null) return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const messages: Anthropic.Beta.BetaMessageParam[] = [];
  for (const m of raw.slice(-MAX_HISTORY)) {
    const role = (m as { role?: unknown })?.role;
    const content = (m as { content?: unknown })?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim();
    if (!text || text.length > MAX_CHARS) return null;
    messages.push({ role, content: text });
  }

  // API yêu cầu tin nhắn đầu tiên và cuối cùng đều của học sinh (user).
  while (messages.length > 0 && messages[0].role !== "user") messages.shift();
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") return null;
  return messages;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[chat] Chưa có ANTHROPIC_API_KEY. Tạo file .env.local theo mẫu .env.example rồi khởi động lại.");
    return new Response(ERROR_TEXT, { status: 500 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (isRateLimited(ip)) {
    return new Response("Bạn gửi tin nhắn hơi nhanh, đợi một chút rồi thử lại nhé.", { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Dữ liệu không hợp lệ.", { status: 400 });
  }
  const messages = parseMessages(body);
  if (!messages) {
    return new Response(`Tin nhắn không hợp lệ hoặc dài quá ${MAX_CHARS} ký tự.`, { status: 400 });
  }

  const lastMessage = messages[messages.length - 1].content as string;
  if (detectCrisis(lastMessage)) {
    messages.push({ role: "system", content: CRISIS_REMINDER });
  }

  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages,
    output_config: { effort: "medium" },
    cache_control: { type: "ephemeral" },
    // Nếu bộ lọc an toàn của model từ chối, tự động thử lại bằng model dự phòng.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  // Gửi câu trả lời về trình duyệt theo từng đoạn nhỏ, để chữ hiện dần như đang gõ.
  const encoder = new TextEncoder();
  const responseBody = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sentText = false;
      const send = (text: string) => {
        controller.enqueue(encoder.encode(text));
        sentText = true;
      };
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send(event.delta.text);
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          send(sentText ? `\n\n${REFUSAL_TEXT}` : REFUSAL_TEXT);
        }
      } catch (err) {
        // Học sinh đóng trang hoặc bấm dừng: không cần báo lỗi.
        if (err instanceof Anthropic.APIUserAbortError) return;

        if (err instanceof Anthropic.AuthenticationError) {
          console.error("[chat] Sai hoặc thiếu ANTHROPIC_API_KEY (xem file .env.example).");
        } else if (err instanceof Anthropic.RateLimitError) {
          console.error("[chat] Vượt giới hạn gọi API của Anthropic.");
        } else if (err instanceof Anthropic.APIError) {
          console.error(`[chat] Lỗi API ${err.status}: ${err.message}`);
        } else {
          console.error("[chat] Lỗi không xác định:", err);
        }
        send(sentText ? `\n\n${ERROR_TEXT}` : ERROR_TEXT);
      }
      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(responseBody, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
