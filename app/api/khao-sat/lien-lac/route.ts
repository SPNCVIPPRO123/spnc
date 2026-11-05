import { createHash } from "node:crypto";
import { ensureSchema, sql } from "@/lib/db";
import { CONTACT_MAX } from "@/lib/submission";

export const runtime = "nodejs";

// Học sinh để lại (hoặc xóa) cách liên lạc ở khung mời hiện ra sau khi xem kết quả khảo sát.
// Chỉ người vừa gửi phiếu mới sửa được, vì cần mã sửa (token) mà trình duyệt nhận được lúc gửi phiếu.

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!sql) return json({ error: "not_configured" }, 503);
  const text = await req.text();
  if (text.length > 2_000) return json({ error: "too_large" }, 413);

  let body: { id?: unknown; token?: unknown; contact?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  if (typeof body.id !== "string" || typeof body.token !== "string" || typeof body.contact !== "string")
    return json({ error: "bad_request" }, 400);

  const contact =
    body.contact
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, CONTACT_MAX) || null;

  try {
    await ensureSchema();
    // Có liên lạc mới: đưa phiếu về "Chưa xử lý" để chuyên viên thấy và liên hệ.
    const rows = await sql`
      UPDATE survey_submissions
      SET contact = ${contact}, contact_later = ${contact !== null}, contact_at = ${contact ? new Date() : null},
          status = CASE WHEN ${contact}::text IS NULL THEN status ELSE 'moi' END
      WHERE id = ${body.id} AND edit_token_hash = ${hashToken(body.token)}
      RETURNING id`;
    if (rows.length === 0) return json({ error: "not_found" }, 404);
    return json({ ok: true });
  } catch (err) {
    console.error("[khao-sat] Lỗi lưu liên lạc:", err);
    return json({ error: "server_error" }, 500);
  }
}
