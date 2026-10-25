import "server-only";
import { neon } from "@neondatabase/serverless";

// Cơ sở dữ liệu Postgres (Neon, gói miễn phí trên Vercel). Vercel tự thêm biến DATABASE_URL khi kết nối Neon với project.
// Chỉ máy chủ được đọc file này: trình duyệt không bao giờ thấy chuỗi kết nối hay dữ liệu phiếu.

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const sql = url ? neon(url) : null;

export function hasDatabase(): boolean {
  return sql !== null;
}

// Bảng được tạo tự động ở lần dùng đầu tiên, không cần chạy lệnh gì.
let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!sql) return Promise.reject(new Error("Chưa có DATABASE_URL"));
  ready ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS survey_submissions (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        edit_token_hash TEXT NOT NULL,
        answers JSONB NOT NULL,
        contact TEXT,
        urgent BOOLEAN NOT NULL DEFAULT false,
        safety BOOLEAN NOT NULL DEFAULT false,
        protection BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'moi'
      )`;
    await sql`CREATE INDEX IF NOT EXISTS survey_submissions_created_idx ON survey_submissions (created_at DESC)`;
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
