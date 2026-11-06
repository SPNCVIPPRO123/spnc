import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, CheckCheck, Video, X } from "lucide-react";
import StaffSetupNotice from "@/components/StaffSetupNotice";
import { formatTime } from "@/components/StaffBadges";
import { hasDatabase } from "@/lib/db";
import { isStaff, isStaffConfigured } from "@/lib/staffAuth";
import { BOOKING, MODE_LABELS, STAFF_NOTE_MAX, STATUS_LABELS, formatSlot } from "@/lib/booking";
import { listAppointments, type StaffFilter } from "@/lib/bookingData";
import { callTiming, opensAtLabel } from "@/lib/videoCall";
import { updateAppointment } from "../actions";

export const dynamic = "force-dynamic";

const FILTERS: { id: StaffFilter; label: string }[] = [
  { id: "sap-toi", label: "Sắp tới" },
  { id: "cho", label: "Chờ xác nhận" },
  { id: "da-qua", label: "Đã qua / đã hủy" },
  { id: "tat-ca", label: "Tất cả" },
];

export default async function StaffAppointmentsPage({ searchParams }: { searchParams: Promise<{ loc?: string }> }) {
  if (!hasDatabase() || !isStaffConfigured()) return <StaffSetupNotice />;
  if (!(await isStaff())) redirect("/dang-nhap?vai=chuyen-vien");

  const params = await searchParams;
  const filter: StaffFilter = FILTERS.some((f) => f.id === params.loc) ? (params.loc as StaffFilter) : "sap-toi";
  const { rows, counts } = await listAppointments(filter);
  const now = Date.now();

  return (
    <>
      <Link href="/chuyen-vien" className="link-button staff-back">
        <ArrowLeft size={16} aria-hidden="true" /> Phiếu khảo sát
      </Link>
      <div className="staff-head">
        <div>
          <h1>Lịch hẹn tư vấn</h1>
          <p className="survey-muted">
            {counts.upcoming} lịch sắp tới
            {counts.waiting > 0 && (
              <>
                {" "}
                · <strong className="staff-urgent-text">{counts.waiting} lịch chờ xác nhận</strong>
              </>
            )}
          </p>
        </div>
      </div>

      <nav className="staff-filters" aria-label="Lọc lịch hẹn">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={`/chuyen-vien/lich-hen?loc=${f.id}`}
            className={`staff-filter ${f.id === filter ? "is-active" : ""}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="survey-card survey-center">
          <p>Chưa có lịch hẹn nào trong mục này.</p>
        </div>
      ) : (
        <ul className="staff-list">
          {rows.map((a) => {
            const past = new Date(a.starts_at).getTime() < now;
            const open = a.status === "cho" || a.status === "xac-nhan";
            return (
              <li
                key={a.id}
                className={`staff-row booking-row ${a.status === "cho" && !past ? "is-alert" : ""} ${open ? "" : "is-done"}`}
              >
                <div className="staff-row-top">
                  <strong>
                    {formatSlot(a.starts_at)} · {MODE_LABELS[a.mode]}
                  </strong>
                  <span className={`staff-badge booking-status-${a.status}`}>{STATUS_LABELS[a.status]}</span>
                </div>
                <div className="staff-row-meta">
                  <span>Học sinh: {a.nickname ? `“${a.nickname}” (biệt danh)` : "tài khoản đã xóa"}</span>
                  <span>Đặt lúc {formatTime(a.created_at)}</span>
                  {a.mode === "offline" && <span>{BOOKING.offlinePlace}</span>}
                </div>
                <p className="staff-contact">
                  {a.contact ? (
                    <>
                      Cách liên lạc: <strong>{a.contact}</strong>
                    </>
                  ) : (
                    "Học sinh không để lại cách liên lạc: hãy nhắn qua ô bên dưới, học sinh sẽ thấy trên trang Đặt lịch."
                  )}
                </p>
                {a.mode === "online" && a.status === "xac-nhan" && callTiming(a.starts_at, now) !== "het" && (
                  <p className="call-entry">
                    <Link
                      href={`/goi-video/${a.id}?vai=cv`}
                      className={`btn btn-sm ${callTiming(a.starts_at, now) === "mo" ? "btn-primary" : "btn-outline"}`}
                    >
                      <Video size={16} aria-hidden="true" />{" "}
                      {callTiming(a.starts_at, now) === "mo"
                        ? "Vào phòng gọi video"
                        : `Phòng gọi video mở lúc ${opensAtLabel(a.starts_at)}`}
                    </Link>
                  </p>
                )}
                {a.mode === "online" && a.status === "cho" && (
                  <p className="survey-muted small">Xác nhận lịch thì học sinh và chuyên viên mới vào được phòng gọi video.</p>
                )}
                {a.note && (
                  <p className="booking-note">
                    Học sinh chia sẻ trước: <em>{a.note}</em>
                  </p>
                )}
                <form action={updateAppointment} className="booking-staff-form">
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="loc" value={filter} />
                  <label htmlFor={`note-${a.id}`}>Lời nhắn cho học sinh, ví dụ đổi phòng, lý do hủy hay link họp khác nếu không dùng phòng gọi của web</label>
                  <textarea
                    id={`note-${a.id}`}
                    name="staff_note"
                    className="survey-text"
                    rows={2}
                    maxLength={STAFF_NOTE_MAX}
                    defaultValue={a.staff_note ?? ""}
                  />
                  <div className="staff-actions">
                    {a.status === "cho" && (
                      <button type="submit" name="status" value="xac-nhan" className="btn btn-primary btn-sm">
                        <Check size={16} aria-hidden="true" /> Xác nhận
                      </button>
                    )}
                    {a.status === "xac-nhan" && (
                      <button type="submit" name="status" value="xac-nhan" className="btn btn-outline btn-sm">
                        Lưu lời nhắn
                      </button>
                    )}
                    {a.status === "xac-nhan" && (
                      <button type="submit" name="status" value="xong" className="btn btn-primary btn-sm">
                        <CheckCheck size={16} aria-hidden="true" /> Đã tư vấn xong
                      </button>
                    )}
                    {open && (
                      <button type="submit" name="status" value="huy" className="btn btn-sm staff-danger">
                        <X size={16} aria-hidden="true" /> Hủy lịch
                      </button>
                    )}
                  </div>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
