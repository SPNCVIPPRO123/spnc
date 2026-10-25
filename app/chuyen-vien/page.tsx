import Link from "next/link";
import { LogOut } from "lucide-react";
import StaffLogin from "@/components/StaffLogin";
import StaffSetupNotice from "@/components/StaffSetupNotice";
import { AlertBadges, StatusBadge, formatTime } from "@/components/StaffBadges";
import { hasDatabase } from "@/lib/db";
import { isStaff, isStaffConfigured } from "@/lib/staffAuth";
import { listSubmissions, type Filter } from "@/lib/staffData";
import { DASS_INFO, LEVEL_LABELS, scoreDass, type DassKey } from "@/lib/survey";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "tat-ca", label: "Tất cả" },
  { id: "canh-bao", label: "Có cảnh báo" },
  { id: "moi", label: "Chưa xử lý" },
];

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ loc?: string; trang?: string }> }) {
  if (!hasDatabase() || !isStaffConfigured()) return <StaffSetupNotice />;
  if (!(await isStaff())) return <StaffLogin />;

  const params = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.id === params.loc) ? (params.loc as Filter) : "tat-ca";
  const page = Math.max(1, Math.floor(Number(params.trang)) || 1);
  const { rows, hasMore, counts } = await listSubmissions(filter, page);
  const href = (f: Filter, p = 1) => `/chuyen-vien?loc=${f}${p > 1 ? `&trang=${p}` : ""}`;

  return (
    <>
      <div className="staff-head">
        <div>
          <h1>Phiếu khảo sát của học sinh</h1>
          <p className="survey-muted">
            {counts.total} phiếu · {counts.open} chưa xử lý
            {counts.urgent > 0 && (
              <>
                {" "}
                · <strong className="staff-urgent-text">{counts.urgent} phiếu trả lời “Có” ở câu C5</strong>
              </>
            )}
            {counts.alerts > 0 && <> · {counts.alerts} phiếu có cảnh báo chưa xử lý</>}
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-outline btn-sm">
            <LogOut size={16} aria-hidden="true" /> Đăng xuất
          </button>
        </form>
      </div>

      <nav className="staff-filters" aria-label="Lọc phiếu">
        {FILTERS.map((f) => (
          <Link key={f.id} href={href(f.id)} className={`staff-filter ${f.id === filter ? "is-active" : ""}`}>
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="survey-card survey-center">
          <p>Chưa có phiếu nào{filter !== "tat-ca" ? " trong mục này" : ""}.</p>
        </div>
      ) : (
        <ul className="staff-list">
          {rows.map((row) => {
            const dass = scoreDass(row.answers);
            return (
              <li key={row.id}>
                <Link
                  href={`/chuyen-vien/phieu/${row.id}`}
                  className={`staff-row ${row.urgent ? "is-urgent" : row.safety || row.protection ? "is-alert" : ""} ${
                    row.status === "da-xu-ly" ? "is-done" : ""
                  }`}
                >
                  <div className="staff-row-top">
                    <strong>
                      Lớp {String(row.answers.A1 ?? "?")} · {formatTime(row.created_at)}
                    </strong>
                    <StatusBadge status={row.status} />
                  </div>
                  <AlertBadges row={row} />
                  <div className="staff-row-meta">
                    {(Object.keys(dass) as DassKey[]).map((k) => (
                      <span key={k} className={`dass-chip level-${dass[k].level}`}>
                        {DASS_INFO[k].name}: {LEVEL_LABELS[dass[k].level]}
                      </span>
                    ))}
                    <span>{row.contact ? "Có để lại liên lạc" : "Ẩn danh"}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {(page > 1 || hasMore) && (
        <div className="survey-nav">
          {page > 1 ? (
            <Link className="btn btn-outline btn-sm" href={href(filter, page - 1)}>
              Trang trước
            </Link>
          ) : (
            <span />
          )}
          {hasMore && (
            <Link className="btn btn-outline btn-sm" href={href(filter, page + 1)}>
              Trang sau
            </Link>
          )}
        </div>
      )}
    </>
  );
}
