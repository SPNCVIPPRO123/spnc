"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE_NAME,
  COOKIE_PATH,
  checkPassword,
  createSessionValue,
  isLoginBlocked,
  isStaff,
  isStaffConfigured,
  recordLoginFailure,
} from "@/lib/staffAuth";
import { deleteSubmission, updateStatus, type Status } from "@/lib/staffData";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!isStaffConfigured()) return { error: "Trang chưa được cài mật khẩu (biến STAFF_PASSWORD)." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isLoginBlocked(ip)) return { error: "Bạn đã nhập sai quá nhiều lần. Hãy thử lại sau 15 phút." };

  const input = form.get("password");
  if (typeof input !== "string" || !checkPassword(input)) {
    recordLoginFailure(ip);
    return { error: "Mật khẩu chưa đúng." };
  }

  const { value, expires } = createSessionValue();
  (await cookies()).set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: COOKIE_PATH,
    expires,
  });
  redirect("/chuyen-vien");
}

export async function logout() {
  (await cookies()).delete({ name: COOKIE_NAME, path: COOKIE_PATH });
  redirect("/chuyen-vien");
}

export async function setStatus(form: FormData) {
  if (!(await isStaff())) redirect("/chuyen-vien");
  const id = String(form.get("id") ?? "");
  const status = form.get("status") === "da-xu-ly" ? "da-xu-ly" : ("moi" as Status);
  await updateStatus(id, status);
  redirect(`/chuyen-vien/phieu/${encodeURIComponent(id)}`);
}

export async function removeSubmission(form: FormData) {
  if (!(await isStaff())) redirect("/chuyen-vien");
  await deleteSubmission(String(form.get("id") ?? ""));
  redirect("/chuyen-vien");
}
