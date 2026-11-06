import "server-only";
import { ensureSchema, sql } from "@/lib/db";
import { isStaff } from "@/lib/staffAuth";
import { currentStudent } from "@/lib/studentAuth";
import { callTiming, type CallRole, type CallTiming } from "@/lib/videoCall";

// Ai được vào phòng gọi video của một lịch hẹn: chỉ học sinh đã đặt lịch đó (theo tài khoản đang đăng nhập)
// và chuyên viên đang đăng nhập. Lịch phải là lịch trực tuyến đã được xác nhận. Mọi yêu cầu đều kiểm tra lại.

export type CallInfo = {
  id: string;
  role: CallRole;
  startsAt: string;
  openedAt: string | null;
  nickname: string | null;
  timing: CallTiming;
};

export type CallDenied = "dang-nhap" | "khong-co" | "chua-xac-nhan";

async function db() {
  if (!sql) throw new Error("Chưa có DATABASE_URL");
  await ensureSchema();
  return sql;
}

// vai = "cv" khi mở từ trang chuyên viên, để một máy đăng nhập cả hai vai (lúc chạy thử) vẫn vào đúng vai.
export async function callAccess(id: string, wanted?: string | null): Promise<CallInfo | CallDenied> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return "khong-co";
  const q = await db();
  const [appt] = (await q`
    SELECT a.id, a.student_id, a.starts_at, a.mode, a.status, a.call_opened_at, s.nickname
    FROM appointments a LEFT JOIN students s ON s.id = a.student_id WHERE a.id = ${id}`) as {
    id: string;
    student_id: string | null;
    starts_at: string | Date;
    mode: string;
    status: string;
    call_opened_at: string | Date | null;
    nickname: string | null;
  }[];

  let role: CallRole | null = null;
  let loggedIn = false;
  if (wanted !== "cv") {
    const student = await currentStudent();
    loggedIn = student !== null;
    if (student && appt && student.id === appt.student_id) role = "hs";
  }
  if (!role && wanted !== "hs" && (await isStaff())) role = "cv";
  // Học sinh khác đang đăng nhập: báo không có phòng, không mời đăng nhập lại.
  if (!role) return appt && !loggedIn ? "dang-nhap" : "khong-co";
  if (!appt || appt.mode !== "online") return "khong-co";
  if (appt.status !== "xac-nhan") return "chua-xac-nhan";

  const startsAt = new Date(appt.starts_at).toISOString();
  const openedAt = appt.call_opened_at ? new Date(appt.call_opened_at).toISOString() : null;
  return { id: appt.id, role, startsAt, openedAt, nickname: appt.nickname, timing: callTiming(startsAt, Date.now(), openedAt) };
}

export type Signal = { id: number; sid: string; target: string | null; kind: string; payload: unknown };

export const SIGNAL_KINDS = ["hello", "offer", "answer", "candidate", "bye"] as const;
const MAX_SIGNALS_PER_CALL = 3000;

export async function postSignal(
  call: CallInfo,
  sid: string,
  target: string | null,
  kind: string,
  payload: unknown,
): Promise<number | null> {
  const q = await db();
  if (kind === "hello") {
    // Dọn tin bắt tay cũ (của các cuộc gọi đã qua) mỗi khi có người vào phòng.
    await q`DELETE FROM call_signals WHERE created_at < now() - interval '1 day'`;
  }
  const rows = (await q`
    INSERT INTO call_signals (appointment_id, sender, sid, target, kind, payload)
    SELECT ${call.id}, ${call.role}, ${sid}, ${target}, ${kind}, ${JSON.stringify(payload ?? null)}::jsonb
    WHERE (SELECT count(*) FROM call_signals WHERE appointment_id = ${call.id}) < ${MAX_SIGNALS_PER_CALL}
    RETURNING id`) as { id: string | number }[];
  return rows.length ? Number(rows[0].id) : null;
}

// Tin của người bên kia, gửi sau tin số "after".
export async function readSignals(call: CallInfo, after: number): Promise<Signal[]> {
  const q = await db();
  const rows = (await q`
    SELECT id, sid, target, kind, payload FROM call_signals
    WHERE appointment_id = ${call.id} AND sender <> ${call.role} AND id > ${after}
    ORDER BY id LIMIT 200`) as (Signal & { id: string | number })[];
  return rows.map((r) => ({ ...r, id: Number(r.id) }));
}
