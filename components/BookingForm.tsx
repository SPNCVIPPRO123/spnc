"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, MessagesSquare, Moon, School } from "lucide-react";
import { book, type BookState } from "@/app/dat-lich/actions";
import { BOOKING, CONTACT_MAX, NOTE_MAX, slotPeriod, slotRange, type Mode } from "@/lib/booking";

export type BookingDay = { date: string; label: string; times: { time: string; full: boolean }[] };

const PERIODS = ["Sáng", "Chiều", "Tối"] as const;

export default function BookingForm({ days }: { days: BookingDay[] }) {
  const [state, action, pending] = useActionState<BookState, FormData>(book, {});
  const [mode, setMode] = useState<Mode | null>(null);
  const [date, setDate] = useState<string>(days.find((d) => d.times.some((t) => !t.full))?.date ?? "");
  const [time, setTime] = useState<string>("");
  const day = days.find((d) => d.date === date);

  // Gửi form mà không để React xóa các ô đã nhập khi báo lỗi.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(() => action(form));
  }

  if (days.length === 0) {
    return <p className="survey-muted">Hiện chưa có khung giờ nào để đặt. Em quay lại sau nhé.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="login-form booking-form">
      <fieldset className="booking-step">
        <legend>1. Em muốn tư vấn theo cách nào?</legend>
        <div className="booking-modes">
          <label className="booking-mode">
            <input type="radio" name="mode" value="online" checked={mode === "online"} onChange={() => setMode("online")} />
            <span>
              <MessagesSquare size={22} aria-hidden="true" />
              <b>Trực tuyến</b>
              <small>Gọi video với chuyên viên ngay trên web này. Khi chuyên viên xác nhận, đến giờ em chỉ cần bấm Vào phòng gọi video.</small>
            </span>
          </label>
          <label className="booking-mode">
            <input type="radio" name="mode" value="offline" checked={mode === "offline"} onChange={() => setMode("offline")} />
            <span>
              <School size={22} aria-hidden="true" />
              <b>Gặp trực tiếp</b>
              <small>{BOOKING.offlinePlace}</small>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset className="booking-step">
        <legend>2. Chọn ngày</legend>
        <MonthCalendar
          days={days}
          selected={date}
          onSelect={(d) => {
            setDate(d);
            setTime("");
          }}
        />
        <input type="hidden" name="date" value={date} />
      </fieldset>

      <fieldset className="booking-step">
        <legend>3. Chọn giờ</legend>
        {!day ? (
          <p className="survey-muted">Em chọn ngày trước nhé.</p>
        ) : (
          PERIODS.map((p) => {
            const times = day.times.filter((t) => slotPeriod(t.time) === p);
            if (!times.length) return null;
            return (
              <div key={p} className="booking-period">
                <span className="booking-period-name">
                  {p === "Tối" && <Moon size={14} aria-hidden="true" />} Buổi {p.toLowerCase()}
                </span>
                <div className="booking-times">
                  {times.map((t) => (
                    <label key={t.time} className="survey-opt" title={t.full ? "Đã có bạn khác đặt" : undefined}>
                      <input
                        type="radio"
                        name="time"
                        value={t.time}
                        checked={time === t.time}
                        disabled={t.full}
                        onChange={() => setTime(t.time)}
                      />
                      <span>{t.full ? `${t.time} · đã kín` : slotRange(t.time)}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </fieldset>

      <fieldset className="booking-step">
        <legend>4. Vài điều thêm, em bỏ qua cũng được</legend>
        <label htmlFor="bk-contact">Cách liên lạc với em</label>
        <input
          id="bk-contact"
          name="contact"
          className="survey-text"
          maxLength={CONTACT_MAX}
          placeholder="Ví dụ: Zalo, số điện thoại hoặc email"
        />
        <p className="survey-muted small">
          Nếu em để trống, chuyên viên sẽ nhắn ngay trên trang này, ở mục “Lịch hẹn của em” bên dưới.
        </p>
        <label htmlFor="bk-note">Điều em muốn chia sẻ trước với chuyên viên</label>
        <textarea id="bk-note" name="note" className="survey-text" rows={3} maxLength={NOTE_MAX} />
      </fieldset>

      {state.error && (
        <p className="survey-missing" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending || !mode || !date || !time}>
        <CalendarCheck size={18} aria-hidden="true" /> {pending ? "Đang gửi…" : "Đặt lịch hẹn"}
      </button>
    </form>
  );
}

const WEEK_HEAD = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

// Lịch tháng giống Google Calendar: ngày còn giờ trống bấm được, kèm số khung giờ còn trống.
function MonthCalendar({
  days,
  selected,
  onSelect,
}: {
  days: BookingDay[];
  selected: string;
  onSelect: (date: string) => void;
}) {
  const months = Array.from(new Set(days.map((d) => d.date.slice(0, 7))));
  const [month, setMonth] = useState(selected.slice(0, 7) || months[0]);
  const byDate = new Map(days.map((d) => [d.date, d]));
  const today = days[0]?.date ?? "";
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // số ô trống trước ngày 1 (tuần bắt đầu Thứ Hai)
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7) cells.push(null);
  const mi = months.indexOf(month);

  return (
    <div className="cal">
      <div className="cal-head">
        <button
          type="button"
          className="cal-nav"
          aria-label="Tháng trước"
          disabled={mi <= 0}
          onClick={() => setMonth(months[mi - 1])}
        >
          <ChevronLeft size={20} />
        </button>
        <strong>
          {MONTH_NAMES[m - 1]}, {y}
        </strong>
        <button
          type="button"
          className="cal-nav"
          aria-label="Tháng sau"
          disabled={mi < 0 || mi >= months.length - 1}
          onClick={() => setMonth(months[mi + 1])}
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="cal-grid" role="grid" aria-label={`${MONTH_NAMES[m - 1]}, ${y}`}>
        {WEEK_HEAD.map((w) => (
          <span key={w} className="cal-weekday" role="columnheader">
            {w}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`e${i}`} className="cal-cell is-empty" />;
          const day = byDate.get(date);
          const free = day ? day.times.filter((t) => !t.full).length : 0;
          const n = Number(date.slice(8));
          if (!day || free === 0) {
            return (
              <span key={date} className={`cal-cell is-off ${date < today ? "is-past" : ""}`} aria-disabled="true">
                <b>{n}</b>
                {day && <small>Kín lịch</small>}
              </span>
            );
          }
          return (
            <button
              key={date}
              type="button"
              className={`cal-cell ${selected === date ? "is-selected" : ""} ${date === today ? "is-today" : ""}`}
              aria-pressed={selected === date}
              aria-label={`${day.label}, còn ${free} khung giờ`}
              onClick={() => onSelect(date)}
            >
              <b>{n}</b>
              <small>
                {free}
                <span className="cal-free-word"> giờ trống</span>
              </small>
            </button>
          );
        })}
      </div>
      <p className="cal-legend survey-muted small">
        <span className="cal-dot" /> Ngày còn giờ trống. Ngày bị mờ là hôm không có buổi tư vấn, hoặc còn xa quá vì em chỉ
        đặt được trong {BOOKING.daysAhead} ngày tới.
      </p>
    </div>
  );
}
