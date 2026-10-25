import "server-only";
import { headers } from "next/headers";

// Chặn dò mật khẩu: mỗi khóa (IP, hoặc IP + biệt danh) tối đa 5 lần sai trong 15 phút (đếm trong bộ nhớ của máy chủ).
const FAIL_LIMIT = 5;
const FAIL_WINDOW_MS = 15 * 60_000;
const failures = new Map<string, number[]>();

export async function clientIp(): Promise<string> {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function isLoginBlocked(key: string, limit = FAIL_LIMIT): boolean {
  const now = Date.now();
  const recent = (failures.get(key) ?? []).filter((t) => now - t < FAIL_WINDOW_MS);
  failures.set(key, recent);
  return recent.length >= limit;
}

export function recordLoginFailure(key: string) {
  if (failures.size > 5000) failures.clear();
  failures.set(key, [...(failures.get(key) ?? []), Date.now()]);
}
