import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, CalendarHeart, ClipboardList, LogOut, Trash2 } from "lucide-react";
import { formatTime } from "@/components/StaffBadges";
import { currentStudent, ownSubmissions } from "@/lib/studentAuth";
import { DASS_INFO, LEVEL_LABELS, scoreDass, type Answers, type DassKey } from "@/lib/survey";
import { deleteAccount, studentLogout } from "../dang-nhap/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tài khoản của em", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const student = await currentStudent();
  if (!student) redirect("/dang-nhap?next=/tai-khoan");
  const rows = await ownSubmissions(student.id);

  return (
    <section className="section staff-section">
      <div className="container staff-shell">
        <div className="staff-head">
          <div>
            <h1>Chào {student.nickname}!</h1>
            <p className="survey-muted">
              Đây là những lần khảo sát em đã gửi bằng tài khoản {student.username}. Chuyên viên chỉ thấy phiếu của em kèm
              biệt danh “{student.nickname}”.
            </p>
          </div>
          <form action={studentLogout}>
            <button type="submit" className="btn btn-outline btn-sm">
              <LogOut size={16} aria-hidden="true" /> Đăng xuất
            </button>
          </form>
        </div>

        <Link href="/nhat-ky" className="survey-card account-diary-link">
          <CalendarHeart size={22} aria-hidden="true" />
          <span>
            <strong>Nhật ký cảm xúc</strong>
            <span className="survey-muted"> · Ghi lại cảm xúc mỗi ngày, chỉ mình em xem được.</span>
          </span>
        </Link>

        <Link href="/dat-lich" className="survey-card account-diary-link account-booking-link">
          <CalendarCheck size={22} aria-hidden="true" />
          <span>
            <strong>Đặt lịch hẹn tư vấn</strong>
            <span className="survey-muted"> · Gọi video hoặc gặp trực tiếp chuyên viên, vào giờ em thấy tiện.</span>
          </span>
        </Link>

        {rows.length === 0 ? (
          <div className="survey-card survey-center">
            <p>Em chưa có lần khảo sát nào trong tài khoản.</p>
            <Link className="btn btn-primary" href="/khao-sat">
              <ClipboardList size={18} aria-hidden="true" /> Làm khảo sát nhanh
            </Link>
          </div>
        ) : (
          <>
            <ul className="staff-list">
              {rows.map((row) => {
                const dass = scoreDass(row.answers as Answers);
                return (
                  <li key={row.id}>
                    <Link href={`/tai-khoan/phieu/${row.id}`} className="staff-row">
                      <strong>Khảo sát ngày {formatTime(row.created_at)}</strong>
                      <div className="staff-row-meta">
                        {(Object.keys(dass) as DassKey[]).map((k) => (
                          <span key={k} className={`dass-chip level-${dass[k].level}`}>
                            {DASS_INFO[k].name}: {LEVEL_LABELS[dass[k].level]}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link className="btn btn-primary" href="/khao-sat">
              <ClipboardList size={18} aria-hidden="true" /> Làm khảo sát lần mới
            </Link>
          </>
        )}

        <details className="staff-delete account-delete">
          <summary className="link-button">
            <Trash2 size={15} aria-hidden="true" /> Xóa tài khoản
          </summary>
          <form action={deleteAccount}>
            <p>
              Xóa tài khoản của em? Em sẽ không xem lại được các lần khảo sát cũ. Những phiếu đã gửi vẫn được giữ
              lại để chuyên viên hỗ trợ, nhưng sẽ không còn kèm biệt danh của em.
            </p>
            <button type="submit" className="btn btn-sm staff-danger">
              Xóa tài khoản
            </button>
          </form>
        </details>
      </div>
    </section>
  );
}
