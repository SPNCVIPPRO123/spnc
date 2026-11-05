import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, CalendarPlus, CalendarX2, CheckCircle2, MessageSquareText, Video } from "lucide-react";
import BookingForm, { type BookingDay } from "@/components/BookingForm";
import { hasDatabase } from "@/lib/db";
import {
  ACTIVE_STATUSES,
  BOOKING,
  MODE_LABELS,
  STATUS_LABELS,
  bookableDays,
  dayLabel,
  formatSlot,
  googleCalendarUrl,
  slotStart,
} from "@/lib/booking";
import { ownAppointments, takenSlots } from "@/lib/bookingData";
import { currentStudent } from "@/lib/studentAuth";
import { callTiming, opensAtLabel } from "@/lib/videoCall";
import { cancelBooking } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đặt lịch hẹn tư vấn", robots: { index: false, follow: false } };

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ "da-dat"?: string }> }) {
  if (!hasDatabase()) {
    return (
      <section className="section staff-section">
        <div className="container staff-shell survey-card">
          <h1>Đặt lịch hẹn tư vấn</h1>
          <p>Trang web chưa được kết nối cơ sở dữ liệu nên chưa đặt lịch được.</p>
        </div>
      </section>
    );
  }
  const student = await currentStudent();
  if (!student) redirect("/dang-nhap?next=/dat-lich");

  const [taken, mine, params] = await Promise.all([takenSlots(), ownAppointments(student.id), searchParams]);
  const days: BookingDay[] = bookableDays().map((d) => ({
    date: d.date,
    label: dayLabel(d.date),
    times: d.times.map((time) => ({
      time,
      full: (taken[slotStart(d.date, time).toISOString()] ?? 0) >= BOOKING.perSlot,
    })),
  }));
  const now = Date.now();
  const isActive = (a: (typeof mine)[number]) =>
    ACTIVE_STATUSES.includes(a.status) && new Date(a.starts_at).getTime() > now;

  return (
    <section className="section staff-section">
      <div className="container staff-shell">
        <h1>
          <CalendarCheck size={26} aria-hidden="true" className="inline-icon" /> Đặt lịch hẹn tư vấn
        </h1>
        <p className="survey-muted">
          Chào {student.nickname}! Chuyên viên sẽ thấy lịch hẹn kèm biệt danh “{student.nickname}”, không thấy tên thật hay
          tài khoản của em. Mỗi buổi khoảng {BOOKING.durationMinutes} phút.
        </p>

        {params["da-dat"] && (
          <div className="booking-done" role="status">
            <CheckCircle2 size={22} aria-hidden="true" />
            <p>
              Em đã đặt lịch xong. Chuyên viên sẽ xác nhận sớm; em xem trạng thái ở mục “Lịch hẹn của em” bên dưới.
            </p>
          </div>
        )}

        <div className="survey-card">
          <BookingForm days={days} />
        </div>

        <h2 className="results-title" id="lich-cua-em">
          Lịch hẹn của em
        </h2>
        {mine.length === 0 ? (
          <p className="survey-muted">Em chưa đặt lịch hẹn nào.</p>
        ) : (
          <ul className="staff-list">
            {mine.map((a) => (
              <li key={a.id} className={`staff-row booking-row status-${a.status} ${isActive(a) ? "" : "is-done"}`}>
                <div className="staff-row-top">
                  <strong>{formatSlot(a.starts_at)}</strong>
                  <span className={`staff-badge booking-status-${a.status}`}>{STATUS_LABELS[a.status]}</span>
                </div>
                <div className="staff-row-meta">
                  <span>{MODE_LABELS[a.mode]}</span>
                  {a.mode === "offline" && <span>{BOOKING.offlinePlace}</span>}
                </div>
                {a.mode === "online" && a.status === "xac-nhan" && callTiming(a.starts_at, now) !== "het" && (
                  <p className="call-entry">
                    {callTiming(a.starts_at, now) === "mo" ? (
                      <Link href={`/goi-video/${a.id}`} className="btn btn-primary btn-sm">
                        <Video size={16} aria-hidden="true" /> Vào phòng gọi video
                      </Link>
                    ) : (
                      <Link href={`/goi-video/${a.id}`} className="btn btn-outline btn-sm">
                        <Video size={16} aria-hidden="true" /> Phòng gọi video mở lúc {opensAtLabel(a.starts_at)}
                      </Link>
                    )}
                  </p>
                )}
                {a.mode === "online" && a.status === "cho" && (
                  <p className="survey-muted small">Khi chuyên viên xác nhận, nút vào phòng gọi video sẽ hiện ở đây.</p>
                )}
                {a.staff_note && (
                  <p className="staff-contact">
                    <MessageSquareText size={15} aria-hidden="true" /> Chuyên viên nhắn: <strong>{a.staff_note}</strong>
                  </p>
                )}
                {isActive(a) && (
                  <a
                    className="link-button booking-gcal"
                    href={googleCalendarUrl(a.starts_at, a.mode, a.staff_note)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <CalendarPlus size={15} aria-hidden="true" /> Thêm vào Google Calendar
                  </a>
                )}
                {isActive(a) && (
                  <details className="staff-delete">
                    <summary className="link-button">
                      <CalendarX2 size={15} aria-hidden="true" /> Hủy lịch này
                    </summary>
                    <form action={cancelBooking}>
                      <input type="hidden" name="id" value={a.id} />
                      <p>Em chắc chắn muốn hủy lịch hẹn này?</p>
                      <button type="submit" className="btn btn-sm staff-danger">
                        Hủy lịch
                      </button>
                    </form>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="survey-muted small">
          Nếu em đang gặp nguy hiểm hoặc cần giúp ngay, đừng chờ lịch hẹn: hãy gọi 111 (miễn phí, 24/7) hoặc{" "}
          <Link href="/tham-van">xem các cách liên hệ khác</Link>.
        </p>
      </div>
    </section>
  );
}
