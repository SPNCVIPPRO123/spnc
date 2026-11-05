import { cookies } from "next/headers";
import { COOKIE_NAME, isStaff } from "@/lib/staffAuth";
import { STUDENT_COOKIE, currentStudent } from "@/lib/studentAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cho menu biết ai đang đăng nhập trên trình duyệt này, để hiện nút "Đăng xuất".
// Chỉ trả biệt danh (không trả tên tài khoản hay dữ liệu phiếu).
export async function GET() {
  const jar = await cookies();
  let student: string | null = null;
  if (jar.has(STUDENT_COOKIE)) {
    try {
      student = (await currentStudent())?.nickname ?? null;
    } catch {
      student = null;
    }
  }
  const staff = jar.has(COOKIE_NAME) ? await isStaff() : false;
  return Response.json({ student, staff }, { headers: { "Cache-Control": "private, no-store" } });
}
