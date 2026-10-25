import Link from "next/link";
import LoginPanel, { type LoginTab } from "@/components/LoginPanel";
import { currentStudent } from "@/lib/studentAuth";
import { studentLogout } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đăng nhập", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ vai?: string; next?: string }> }) {
  const { vai, next } = await searchParams;
  const tab: LoginTab = vai === "chuyen-vien" || vai === "dang-ky" ? vai : "dang-nhap";
  const student = await currentStudent();

  return (
    <section className="section login-section">
      <div className="container login-shell">
        <h1>Đăng nhập</h1>
        {student && (
          <div className="survey-card result-note login-current">
            <p>
              Em đang đăng nhập bằng tài khoản <strong>{student.username}</strong> (biệt danh {student.nickname}).{" "}
              <Link href="/tai-khoan">Xem tài khoản của em</Link>
            </p>
            <form action={studentLogout}>
              <button type="submit" className="link-button">
                Đăng xuất
              </button>
            </form>
          </div>
        )}
        <LoginPanel initialTab={tab} next={next} />
      </div>
    </section>
  );
}
