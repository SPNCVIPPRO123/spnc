"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { CalendarCheck, MessagesSquare, Moon, School } from "lucide-react";
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
              <small>Gọi video hoặc nhắn tin với chuyên viên. Chuyên viên sẽ gửi đường link khi xác nhận lịch.</small>
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
        <div className="booking-days">
          {days.map((d) => {
            const allFull = d.times.every((t) => t.full);
            return (
              <label key={d.date} className="survey-opt">
                <input
                  type="radio"
                  name="date"
                  value={d.date}
                  checked={date === d.date}
                  disabled={allFull}
                  onChange={() => {
                    setDate(d.date);
                    setTime("");
                  }}
                />
                <span>{d.label}</span>
              </label>
            );
          })}
        </div>
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
        <legend>4. Thêm thông tin (không bắt buộc)</legend>
        <label htmlFor="bk-contact">Cách liên lạc với em</label>
        <input
          id="bk-contact"
          name="contact"
          className="survey-text"
          maxLength={CONTACT_MAX}
          placeholder="Ví dụ: Zalo, số điện thoại hoặc email"
        />
        <p className="survey-muted small">
          Nếu để trống, chuyên viên sẽ nhắn cho em ngay trên trang này (mục “Lịch hẹn của em” bên dưới).
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
