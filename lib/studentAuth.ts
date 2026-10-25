import "server-only";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { ensureSchema, sql } from "@/lib/db";

// Tài khoản học sinh: đăng nhập bằng biệt danh và mật khẩu. Mật khẩu được băm bằng scrypt trước khi lưu.
// Phiên đăng nhập lưu trong cơ sở dữ liệu; trình duyệt chỉ giữ một mã ngẫu nhiên trong cookie HttpOnly.

export const STUDENT_COOKIE = "hs_session";
const SESSION_DAYS = 30;
export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 30;
export const STUDENT_PASSWORD_MIN = 8;

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type Student = { id: string; nickname: string };

export function cleanNickname(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  if (name.length < NICKNAME_MIN || name.length > NICKNAME_MAX) return null;
  // Chữ cái (kể cả tiếng Việt), số, khoảng trắng và _ . -
  return /^[\p{L}\p{N} _.\-]+$/u.test(name) ? name : null;
}

const nicknameKey = (name: string) => name.toLocaleLowerCase("vi");

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 32);
  return `${salt.toString("base64")}:${hash.toString("base64")}`;
}

async function checkHash(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

async function db() {
  if (!sql) throw new Error("Chưa có DATABASE_URL");
  await ensureSchema();
  return sql;
}

export async function createStudent(nickname: string, password: string): Promise<Student | "taken"> {
  const q = await db();
  const id = randomUUID();
  const rows = await q`
    INSERT INTO students (id, nickname, nickname_key, password_hash)
    VALUES (${id}, ${nickname}, ${nicknameKey(nickname)}, ${await hashPassword(password)})
    ON CONFLICT (nickname_key) DO NOTHING
    RETURNING id`;
  return rows.length ? { id, nickname } : "taken";
}

export async function findStudent(nickname: string, password: string): Promise<Student | null> {
  const q = await db();
  const rows = await q`SELECT id, nickname, password_hash FROM students WHERE nickname_key = ${nicknameKey(nickname)}`;
  const row = rows[0] as { id: string; nickname: string; password_hash: string } | undefined;
  if (!row || !(await checkHash(password, row.password_hash))) return null;
  return { id: row.id, nickname: row.nickname };
}

export async function startSession(studentId: string) {
  const q = await db();
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await q`DELETE FROM student_sessions WHERE expires_at < now()`;
  await q`INSERT INTO student_sessions (token_hash, student_id, expires_at) VALUES (${sha256(token)}, ${studentId}, ${expires})`;
  (await cookies()).set(STUDENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function currentStudent(): Promise<Student | null> {
  if (!sql) return null;
  const token = (await cookies()).get(STUDENT_COOKIE)?.value;
  if (!token) return null;
  const q = await db();
  const rows = await q`
    SELECT s.id, s.nickname FROM student_sessions ss JOIN students s ON s.id = ss.student_id
    WHERE ss.token_hash = ${sha256(token)} AND ss.expires_at > now()`;
  return (rows[0] as Student | undefined) ?? null;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(STUDENT_COOKIE)?.value;
  if (token && sql) {
    const q = await db();
    await q`DELETE FROM student_sessions WHERE token_hash = ${sha256(token)}`;
  }
  jar.delete(STUDENT_COOKIE);
}

// Xóa tài khoản: phiếu đã gửi vẫn ở lại cho chuyên viên nhưng không còn gắn với tài khoản nào.
export async function deleteStudent(studentId: string) {
  const q = await db();
  await q`DELETE FROM students WHERE id = ${studentId}`;
  (await cookies()).delete(STUDENT_COOKIE);
}

export type OwnSubmission = { id: string; created_at: string | Date; answers: Record<string, unknown> };

export async function ownSubmissions(studentId: string): Promise<OwnSubmission[]> {
  const q = await db();
  return (await q`
    SELECT id, created_at, answers FROM survey_submissions
    WHERE student_id = ${studentId} ORDER BY created_at DESC LIMIT 100`) as OwnSubmission[];
}

export async function ownSubmission(studentId: string, id: string): Promise<OwnSubmission | null> {
  const q = await db();
  const rows = await q`
    SELECT id, created_at, answers FROM survey_submissions WHERE student_id = ${studentId} AND id = ${id}`;
  return (rows[0] as OwnSubmission | undefined) ?? null;
}
