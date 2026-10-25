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
    // Tài khoản học sinh: chỉ có biệt danh và mật khẩu đã băm, không có họ tên hay email.
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        nickname TEXT NOT NULL,
        nickname_key TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    // Đăng nhập bằng "tài khoản" (username); biệt danh là tên hiện cho chuyên viên, có thể trùng nhau.
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS username TEXT`;
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS username_key TEXT`;
    await sql`UPDATE students SET username = nickname, username_key = nickname_key WHERE username_key IS NULL`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS students_username_key_idx ON students (username_key)`;
    await sql`ALTER TABLE students DROP CONSTRAINT IF EXISTS students_nickname_key_key`;
    await sql`
      CREATE TABLE IF NOT EXISTS student_sessions (
        token_hash TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL
      )`;
    await sql`ALTER TABLE survey_submissions ADD COLUMN IF NOT EXISTS student_id TEXT REFERENCES students(id) ON DELETE SET NULL`;
    await sql`CREATE INDEX IF NOT EXISTS survey_submissions_student_idx ON survey_submissions (student_id)`;
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}
