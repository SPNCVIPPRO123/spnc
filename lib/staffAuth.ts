import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Đăng nhập cho chuyên viên bằng một mật khẩu chung, đặt ở biến môi trường STAFF_PASSWORD trên Vercel.
// Mật khẩu chỉ được so sánh trên máy chủ. Sau khi đăng nhập, trình duyệt giữ một cookie đã ký (HttpOnly,
// JavaScript trên trang không đọc được), hết hạn sau 8 giờ. Đổi mật khẩu sẽ đăng xuất mọi người.

export const COOKIE_NAME = "cv_session";
export const COOKIE_PATH = "/chuyen-vien";
export const SESSION_HOURS = 8;
export const MIN_PASSWORD_LENGTH = 10;

function password(): string | null {
  const p = process.env.STAFF_PASSWORD;
  return p && p.length >= MIN_PASSWORD_LENGTH ? p : null;
}

export function isStaffConfigured(): boolean {
  return password() !== null;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest();

export function checkPassword(input: string): boolean {
  const p = password();
  if (!p) return false;
  return timingSafeEqual(sha256(input), sha256(p));
}

function sign(expires: number, p: string): string {
  return createHmac("sha256", `cv-session:${p}`).update(String(expires)).digest("base64url");
}

export function createSessionValue(): { value: string; expires: Date } {
  const p = password();
  if (!p) throw new Error("Chưa đặt STAFF_PASSWORD");
  const expires = Date.now() + SESSION_HOURS * 3600_000;
  return { value: `${expires}.${sign(expires, p)}`, expires: new Date(expires) };
}

export async function isStaff(): Promise<boolean> {
  const p = password();
  if (!p) return false;
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return false;
  const [exp, sig] = value.split(".");
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < Date.now() || !sig) return false;
  const expected = Buffer.from(sign(expires, p));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
