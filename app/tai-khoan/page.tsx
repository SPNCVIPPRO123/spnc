import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, LogOut, Trash2 } from "lucide-react";
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
              Tài khoản: {student.username}. Đây là các lần khảo sát em đã gửi khi đăng nhập. Chuyên viên thấy phiếu kèm
              biệt danh “{student.nickname}”.
            </p>
          </div>
          <form action={studentLogout}>
            <button type="submit" className="btn btn-outline btn-sm">
              <LogOut size={16} aria-hidden="true" /> Đăng xuất
            </button>
          </form>
        </div>

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
              Xóa tài khoản của em? Em sẽ không xem lại được các lần khảo sát cũ. Phiếu đã gửi vẫn được giữ (không kèm biệt
              danh nữa) để chuyên viên hỗ trợ học sinh.
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
