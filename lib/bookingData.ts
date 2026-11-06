import "server-only";
import { randomUUID } from "node:crypto";
import { ensureSchema, sql } from "@/lib/db";
import { isStaff } from "@/lib/staffAuth";
import { BOOKING, type AppointmentStatus, type Mode } from "@/lib/booking";

// Mọi truy vấn lịch hẹn đi qua file này. Hàm của học sinh luôn lọc theo student_id của người đang đăng nhập;
// hàm của chuyên viên luôn kiểm tra đăng nhập chuyên viên trước.

export type Appointment = {
  id: string;
  starts_at: string | Date;
  mode: Mode;
  contact: string | null;
  note: string | null;
  status: AppointmentStatus;
  staff_note: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  call_opened_at: string | Date | null;
};

export type StaffAppointment = Appointment & { nickname: string | null };

async function db() {
  if (!sql) throw new Error("Chưa có DATABASE_URL");
  await ensureSchema();
  return sql;
}

async function staffDb() {
  if (!(await isStaff())) throw new Error("Chưa đăng nhập chuyên viên");
  return db();
}

// Số lịch đang giữ chỗ ở mỗi khung giờ trong thời gian tới (chỉ đếm, không trả về ai đặt).
export async function takenSlots(): Promise<Record<string, number>> {
  const q = await db();
  const rows = (await q`
    SELECT starts_at, count(*)::int AS n FROM appointments
    WHERE status IN ('cho', 'xac-nhan') AND starts_at > now()
    GROUP BY starts_at`) as { starts_at: string | Date; n: number }[];
  return Object.fromEntries(rows.map((r) => [new Date(r.starts_at).toISOString(), r.n]));
}

export type BookResult = "ok" | "full" | "limit" | "duplicate";

export async function bookAppointment(
  studentId: string,
  startsAt: Date,
  mode: Mode,
  contact: string | null,
  note: string | null,
): Promise<BookResult> {
  const q = await db();
  const [own] = (await q`
    SELECT count(*)::int AS active,
           count(*) FILTER (WHERE starts_at = ${startsAt})::int AS same
    FROM appointments
    WHERE student_id = ${studentId} AND status IN ('cho', 'xac-nhan') AND starts_at > now()`) as {
    active: number;
    same: number;
  }[];
  if (own.same > 0) return "duplicate";
  if (own.active >= BOOKING.maxActivePerStudent) return "limit";

  // Chỉ thêm khi khung giờ còn chỗ (kiểm tra và thêm trong cùng một câu lệnh).
  const rows = await q`
    INSERT INTO appointments (id, student_id, starts_at, mode, contact, note)
    SELECT ${randomUUID()}, ${studentId}, ${startsAt}, ${mode}, ${contact}, ${note}
    WHERE (SELECT count(*) FROM appointments WHERE starts_at = ${startsAt} AND status IN ('cho', 'xac-nhan'))
          < ${BOOKING.perSlot}
    RETURNING id`;
  return rows.length ? "ok" : "full";
}

export async function ownAppointments(studentId: string): Promise<Appointment[]> {
  const q = await db();
  return (await q`
    SELECT id, starts_at, mode, contact, note, status, staff_note, created_at, updated_at, call_opened_at FROM appointments
    WHERE student_id = ${studentId}
    ORDER BY (status IN ('cho', 'xac-nhan') AND starts_at > now()) DESC, starts_at DESC
    LIMIT 50`) as Appointment[];
}

export async function cancelOwnAppointment(studentId: string, id: string) {
  const q = await db();
  await q`
    UPDATE appointments SET status = 'hs-huy', updated_at = now()
    WHERE id = ${id} AND student_id = ${studentId} AND status IN ('cho', 'xac-nhan') AND starts_at > now()`;
}

export type StaffFilter = "sap-toi" | "cho" | "da-qua" | "tat-ca";

export async function listAppointments(filter: StaffFilter) {
  const q = await staffDb();
  // "Sắp tới" giữ cả các lịch trong 2 giờ vừa qua, để chuyên viên kịp đánh dấu đã tư vấn.
  const rows = (await q`
    SELECT a.id, a.starts_at, a.mode, a.contact, a.note, a.status, a.staff_note, a.created_at, a.updated_at, a.call_opened_at, s.nickname
    FROM appointments a LEFT JOIN students s ON s.id = a.student_id
    WHERE CASE ${filter}::text
      WHEN 'sap-toi' THEN a.status IN ('cho', 'xac-nhan') AND a.starts_at > now() - interval '2 hours'
      WHEN 'cho' THEN a.status = 'cho' AND a.starts_at > now()
      WHEN 'da-qua' THEN a.status NOT IN ('cho', 'xac-nhan') OR a.starts_at <= now() - interval '2 hours'
      ELSE true END
    ORDER BY CASE WHEN ${filter}::text IN ('sap-toi', 'cho') THEN a.starts_at END ASC, a.starts_at DESC
    LIMIT 200`) as StaffAppointment[];
  const [counts] = (await q`
    SELECT count(*) FILTER (WHERE status = 'cho' AND starts_at > now())::int AS waiting,
           count(*) FILTER (WHERE status IN ('cho', 'xac-nhan') AND starts_at > now() - interval '2 hours')::int AS upcoming
    FROM appointments`) as { waiting: number; upcoming: number }[];
  return { rows, counts };
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus, staffNote: string | null) {
  const q = await staffDb();
  await q`
    UPDATE appointments SET status = ${status}, staff_note = ${staffNote}, updated_at = now() WHERE id = ${id}`;
}

export async function waitingCount(): Promise<number> {
  const q = await staffDb();
  const [row] = (await q`
    SELECT count(*)::int AS n FROM appointments WHERE status = 'cho' AND starts_at > now()`) as { n: number }[];
  return row.n;
}

// Chuyên viên mở phòng gọi video ngay, không chờ đến giờ hẹn (chỉ lịch trực tuyến đã xác nhận).
export async function openCallNow(id: string) {
  const q = await staffDb();
  await q`
    UPDATE appointments SET call_opened_at = now(), updated_at = now()
    WHERE id = ${id} AND mode = 'online' AND status = 'xac-nhan'`;
}
