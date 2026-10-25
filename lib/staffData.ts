import "server-only";
import { ensureSchema, sql } from "@/lib/db";
import { isStaff } from "@/lib/staffAuth";
import type { Answers } from "@/lib/survey";

// Mọi truy vấn phiếu đều đi qua file này và đều kiểm tra đăng nhập chuyên viên trước,
// để không trang hay hành động nào vô tình trả dữ liệu cho người chưa đăng nhập.

export type Status = "moi" | "da-xu-ly";
export type Filter = "tat-ca" | "canh-bao" | "moi";

export type SubmissionRow = {
  id: string;
  created_at: string | Date;
  updated_at: string | Date;
  answers: Answers;
  contact: string | null;
  urgent: boolean;
  safety: boolean;
  protection: boolean;
  status: Status;
};

export const PAGE_SIZE = 50;

async function db() {
  if (!(await isStaff())) throw new Error("Chưa đăng nhập chuyên viên");
  if (!sql) throw new Error("Chưa có DATABASE_URL");
  await ensureSchema();
  return sql;
}

export async function listSubmissions(filter: Filter, page: number) {
  const q = await db();
  const offset = (page - 1) * PAGE_SIZE;
  const alertsOnly = filter === "canh-bao";
  const newOnly = filter === "moi";
  // Phiếu chưa xử lý có cảnh báo luôn nằm trên cùng: C5 "Có" trước, rồi các cảnh báo khác.
  const rows = (await q`
    SELECT id, created_at, updated_at, answers, contact, urgent, safety, protection, status
    FROM survey_submissions
    WHERE (${!alertsOnly} OR urgent OR safety OR protection) AND (${!newOnly} OR status = 'moi')
    ORDER BY (status = 'moi' AND urgent) DESC, (status = 'moi' AND (safety OR protection)) DESC, created_at DESC
    LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}`) as SubmissionRow[];
  const [counts] = await q`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE status = 'moi')::int AS open,
           count(*) FILTER (WHERE status = 'moi' AND urgent)::int AS urgent,
           count(*) FILTER (WHERE status = 'moi' AND (safety OR protection))::int AS alerts
    FROM survey_submissions`;
  return {
    rows: rows.slice(0, PAGE_SIZE),
    hasMore: rows.length > PAGE_SIZE,
    counts: counts as { total: number; open: number; urgent: number; alerts: number },
  };
}

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  const q = await db();
  const rows = (await q`
    SELECT id, created_at, updated_at, answers, contact, urgent, safety, protection, status
    FROM survey_submissions WHERE id = ${id}`) as SubmissionRow[];
  return rows[0] ?? null;
}

export async function updateStatus(id: string, status: Status) {
  const q = await db();
  await q`UPDATE survey_submissions SET status = ${status} WHERE id = ${id}`;
}

export async function deleteSubmission(id: string) {
  const q = await db();
  await q`DELETE FROM survey_submissions WHERE id = ${id}`;
}
