import "server-only";
import { ensureSchema, sql } from "@/lib/db";
import type { MoodEntry, MoodKey } from "@/lib/moods";

// Nhật ký cảm xúc: mỗi học sinh có tối đa một dòng cho mỗi ngày.
// Chỉ chính học sinh đó xem được; trang chuyên viên không đọc bảng này.

let ready: Promise<void> | null = null;

async function db() {
  if (!sql) throw new Error("Chưa có DATABASE_URL");
  const q = sql;
  await ensureSchema();
  ready ??= (async () => {
    await q`
      CREATE TABLE IF NOT EXISTS mood_entries (
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        day DATE NOT NULL,
        mood TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (student_id, day)
      )`;
  })().catch((err) => {
    ready = null;
    throw err;
  });
  await ready;
  return q;
}

// Các ngày nằm trong một trong các khoảng [từ, đến] (tháng đang xem và 7 ngày gần đây).
export async function moodEntries(
  studentId: string,
  ranges: [string, string][],
): Promise<MoodEntry[]> {
  const q = await db();
  const out = new Map<string, MoodEntry>();
  for (const [from, to] of ranges) {
    const rows = (await q`
      SELECT to_char(day, 'YYYY-MM-DD') AS day, mood, note FROM mood_entries
      WHERE student_id = ${studentId} AND day BETWEEN ${from}::date AND ${to}::date`) as MoodEntry[];
    for (const r of rows) out.set(r.day, r);
  }
  return [...out.values()];
}

export async function saveMood(studentId: string, day: string, mood: MoodKey, note: string) {
  const q = await db();
  await q`
    INSERT INTO mood_entries (student_id, day, mood, note)
    VALUES (${studentId}, ${day}::date, ${mood}, ${note})
    ON CONFLICT (student_id, day) DO UPDATE SET mood = EXCLUDED.mood, note = EXCLUDED.note, updated_at = now()`;
}

export async function deleteMood(studentId: string, day: string) {
  const q = await db();
  await q`DELETE FROM mood_entries WHERE student_id = ${studentId} AND day = ${day}::date`;
}
