"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasDatabase } from "@/lib/db";
import { clientIp, isLoginBlocked, recordLoginFailure } from "@/lib/loginLimit";
import { COOKIE_NAME, COOKIE_PATH, checkPassword, createSessionValue, isStaffConfigured } from "@/lib/staffAuth";
import {
  NICKNAME_MAX,
  NICKNAME_MIN,
  STUDENT_PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
  cleanNickname,
  cleanUsername,
  createStudent,
  currentStudent,
  deleteStudent,
  endSession,
  findStudent,
  startSession,
} from "@/lib/studentAuth";

export type FormState = { error?: string };

const TOO_MANY = "Bạn đã nhập sai quá nhiều lần. Hãy thử lại sau 15 phút.";
const NO_DB = "Trang web chưa được kết nối cơ sở dữ liệu.";

// Nơi chuyển tới sau khi học sinh đăng nhập: chỉ nhận đường dẫn nội bộ của web.
function nextPath(form: FormData): string {
  const next = form.get("next");
  return typeof next === "string" && /^\/(?!\/)[\w\-/]*$/.test(next) ? next : "/tai-khoan";
}

export async function staffLogin(_prev: FormState, form: FormData): Promise<FormState> {
  if (!isStaffConfigured()) return { error: "Trang chưa được cài mật khẩu (biến STAFF_PASSWORD)." };
  const key = `cv:${await clientIp()}`;
  if (isLoginBlocked(key)) return { error: TOO_MANY };

  const input = form.get("password");
  if (typeof input !== "string" || !checkPassword(input)) {
    recordLoginFailure(key);
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

export async function studentLogin(_prev: FormState, form: FormData): Promise<FormState> {
  if (!hasDatabase()) return { error: NO_DB };
  // Cả lớp có thể dùng chung một địa chỉ IP của trường, nên đếm lần sai theo IP + tài khoản.
  // Không kiểm tra định dạng khi đăng nhập: tài khoản tạo trước khi có ô "Tài khoản" dùng biệt danh (có dấu) làm tên đăng nhập.
  const raw = form.get("username");
  const username = typeof raw === "string" && raw.trim().length > 0 && raw.length <= 60 ? raw.trim() : null;
  const key = `hs:${await clientIp()}:${username?.toLowerCase()}`;
  if (isLoginBlocked(key)) return { error: TOO_MANY };

  const password = form.get("password");
  const student = username && typeof password === "string" ? await findStudent(username, password) : null;
  if (!student) {
    recordLoginFailure(key);
    return { error: "Tài khoản hoặc mật khẩu chưa đúng." };
  }
  await startSession(student.id);
  redirect(nextPath(form));
}

export async function studentRegister(_prev: FormState, form: FormData): Promise<FormState> {
  if (!hasDatabase()) return { error: NO_DB };
  const key = `dk:${await clientIp()}`;
  // Tối đa 40 tài khoản mới mỗi 15 phút từ một IP (đủ cho một lớp dùng chung mạng trường).
  if (isLoginBlocked(key, 40)) return { error: "Có quá nhiều tài khoản vừa được tạo từ mạng này. Hãy thử lại sau 15 phút." };

  const username = cleanUsername(form.get("username"));
  if (!username)
    return {
      error: `Tài khoản cần dài ${USERNAME_MIN}–${USERNAME_MAX} ký tự, chỉ gồm chữ không dấu, số hoặc dấu _ . - (không có khoảng trắng).`,
    };
  const nickname = cleanNickname(form.get("nickname"));
  if (!nickname)
    return {
      error: `Biệt danh cần dài ${NICKNAME_MIN}–${NICKNAME_MAX} ký tự, chỉ gồm chữ, số, khoảng trắng hoặc dấu _ . -`,
    };
  const password = form.get("password");
  if (typeof password !== "string" || password.length < STUDENT_PASSWORD_MIN || password.length > 200)
    return { error: `Mật khẩu cần có ít nhất ${STUDENT_PASSWORD_MIN} ký tự.` };
  if (password !== form.get("password2")) return { error: "Hai lần nhập mật khẩu chưa giống nhau." };

  // Đếm mọi lần tạo tài khoản, để một máy không tạo hàng loạt tài khoản.
  recordLoginFailure(key);
  const student = await createStudent(username, nickname, password);
  if (student === "taken") return { error: "Tài khoản này đã có người dùng. Em chọn tên tài khoản khác nhé." };
  await startSession(student.id);
  redirect(nextPath(form));
}

export async function studentLogout() {
  await endSession();
  redirect("/dang-nhap");
}

export async function deleteAccount() {
  const student = await currentStudent();
  if (student) await deleteStudent(student.id);
  redirect("/dang-nhap");
}
