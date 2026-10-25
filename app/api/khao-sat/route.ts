import { createHash, randomBytes, randomUUID } from "node:crypto";
import { ensureSchema, sql } from "@/lib/db";
import { currentStudent } from "@/lib/studentAuth";
import { sanitizeAnswers, sanitizeContact } from "@/lib/submission";
import { protectionConcern, safetyConcern } from "@/lib/survey";

export const runtime = "nodejs";

// Nhận phiếu khảo sát học sinh gửi lên và lưu vào cơ sở dữ liệu để chuyên viên xem ở trang /chuyen-vien.
// Không lưu địa chỉ IP hay thông tin trình duyệt. Chỉ lưu câu trả lời, cách liên lạc (nếu học sinh tự để lại), thời gian gửi
// và tài khoản của em nếu em đang đăng nhập (để em xem lại kết quả; chuyên viên thấy biệt danh của em).

const MAX_BODY = 50_000; // byte
const RATE_LIMIT = 10; // số lần gửi tối đa…
const RATE_WINDOW_MS = 10 * 60_000; // …trong 10 phút, cho mỗi địa chỉ IP

// Bộ đếm đơn giản trong bộ nhớ (giống app/api/chat/route.ts).
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

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!sql) {
    console.error("[khao-sat] Chưa có DATABASE_URL. Xem hướng dẫn kết nối cơ sở dữ liệu trong README.");
    return json({ error: "not_configured" }, 503);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) return json({ error: "rate_limited" }, 429);

  const text = await req.text();
  if (text.length > MAX_BODY) return json({ error: "too_large" }, 413);

  let body: { answers?: unknown; contact?: unknown; id?: unknown; token?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const answers = sanitizeAnswers(body?.answers);
  if (!answers) return json({ error: "incomplete" }, 400);
  const contact = sanitizeContact(body.contact, answers);
  const safety = safetyConcern(answers);
  const protection = protectionConcern(answers);
  const data = JSON.stringify(answers);

  try {
    await ensureSchema();
    const studentId = (await currentStudent())?.id ?? null;

    // Học sinh bấm "Xem lại câu trả lời" rồi gửi lại: cập nhật phiếu cũ thay vì tạo phiếu mới.
    if (typeof body.id === "string" && typeof body.token === "string") {
      const rows = await sql`
        UPDATE survey_submissions
        SET answers = ${data}::jsonb, contact = ${contact}, urgent = ${safety.urgent}, safety = ${safety.flagged},
            protection = ${protection}, student_id = COALESCE(${studentId}, student_id), updated_at = now()
        WHERE id = ${body.id} AND edit_token_hash = ${hashToken(body.token)}
        RETURNING id`;
      if (rows.length > 0) return json({ id: body.id, token: body.token });
    }

    const id = randomUUID();
    const token = randomBytes(32).toString("base64url");
    await sql`
      INSERT INTO survey_submissions (id, edit_token_hash, answers, contact, urgent, safety, protection, student_id)
      VALUES (${id}, ${hashToken(token)}, ${data}::jsonb, ${contact}, ${safety.urgent}, ${safety.flagged}, ${protection}, ${studentId})`;
    return json({ id, token });
  } catch (err) {
    console.error("[khao-sat] Lỗi lưu phiếu:", err);
    return json({ error: "server_error" }, 500);
  }
}
