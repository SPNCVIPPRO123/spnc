// Cấu hình lịch hẹn tư vấn. Muốn đổi ngày, khung giờ (ví dụ bỏ buổi tối) thì chỉ cần sửa ở đây.
// File này dùng chung cho trình duyệt và máy chủ, nên không được chứa dữ liệu bí mật.
// Đây là sản phẩm nghiên cứu: địa điểm, khung giờ đều là giả định, sửa lại khi dùng thật.

import { siteConfig } from "@/lib/siteConfig";

export const BOOKING = {
  // Học sinh được đặt trước tối đa bao nhiêu ngày.
  daysAhead: 14,
  // Phải đặt trước giờ hẹn ít nhất bao nhiêu giờ.
  minHoursBefore: 2,
  // Các ngày trong tuần có tư vấn: 0 = Chủ nhật, 1 = Thứ Hai, ..., 6 = Thứ Bảy.
  weekdays: [1, 2, 3, 4, 5, 6] as number[],
  // Giờ bắt đầu của từng khung (giờ Việt Nam). Mỗi buổi kéo dài durationMinutes phút.
  // Các khung từ 18:00 trở đi là buổi tối: tạm mở để học sinh đặt, chờ hỏi lại các chuyên viên.
  slots: ["07:30", "08:30", "09:30", "10:30", "13:30", "14:30", "15:30", "16:30", "18:30", "19:30", "20:30"],
  durationMinutes: 45,
  // Mỗi khung giờ nhận tối đa bao nhiêu lịch (bằng số chuyên viên trực cùng lúc).
  perSlot: 1,
  // Mỗi học sinh có tối đa bao nhiêu lịch đang chờ hoặc đã xác nhận cùng lúc.
  maxActivePerStudent: 2,
  // Nơi gặp trực tiếp (giả định, lấy từ lib/siteConfig.ts).
  offlinePlace: siteConfig.counselingRoom,
};

export type Mode = "online" | "offline";
export const MODE_LABELS: Record<Mode, string> = { online: "Trực tuyến", offline: "Gặp trực tiếp" };

// cho = chờ chuyên viên xác nhận; xac-nhan = đã xác nhận; xong = đã tư vấn;
// huy = chuyên viên hủy; hs-huy = học sinh tự hủy.
export type AppointmentStatus = "cho" | "xac-nhan" | "xong" | "huy" | "hs-huy";
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  cho: "Chờ xác nhận",
  "xac-nhan": "Đã xác nhận",
  xong: "Đã tư vấn",
  huy: "Chuyên viên đã hủy",
  "hs-huy": "Học sinh đã hủy",
};
export const ACTIVE_STATUSES: AppointmentStatus[] = ["cho", "xac-nhan"];

export const NOTE_MAX = 500;
export const CONTACT_MAX = 120;
export const STAFF_NOTE_MAX = 500;

// Việt Nam dùng UTC+7 quanh năm (không đổi giờ mùa hè).
const VN_OFFSET_MS = 7 * 3600_000;
const WEEKDAY_NAMES = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export function vnToday(now = Date.now()): string {
  return new Date(now + VN_OFFSET_MS).toISOString().slice(0, 10);
}

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

export function slotStart(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+07:00`);
}

export function dayLabel(date: string): string {
  const [, m, d] = date.split("-");
  return `${WEEKDAY_NAMES[weekday(date)]}, ${d}/${m}`;
}

export function slotPeriod(time: string): "Sáng" | "Chiều" | "Tối" {
  const h = Number(time.slice(0, 2));
  return h < 12 ? "Sáng" : h < 18 ? "Chiều" : "Tối";
}

export function slotRange(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const end = h * 60 + m + BOOKING.durationMinutes;
  return `${time} – ${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}

// Các ngày và khung giờ còn đặt được, tính từ bây giờ.
export function bookableDays(now = Date.now()): { date: string; times: string[] }[] {
  const earliest = now + BOOKING.minHoursBefore * 3600_000;
  const today = vnToday(now);
  const days: { date: string; times: string[] }[] = [];
  for (let i = 0; i <= BOOKING.daysAhead; i++) {
    const date = addDays(today, i);
    if (!BOOKING.weekdays.includes(weekday(date))) continue;
    const times = BOOKING.slots.filter((t) => slotStart(date, t).getTime() >= earliest);
    if (times.length) days.push({ date, times });
  }
  return days;
}

export function isBookable(date: string, time: string, now = Date.now()): boolean {
  return bookableDays(now).some((d) => d.date === date && d.times.includes(time));
}

// Hiện ngày giờ của một lịch hẹn theo giờ Việt Nam, ví dụ "Thứ Hai, 10/11 · 18:30 – 19:15".
export function formatSlot(startsAt: string | Date): string {
  const vn = new Date(new Date(startsAt).getTime() + VN_OFFSET_MS).toISOString();
  return `${dayLabel(vn.slice(0, 10))} · ${slotRange(vn.slice(11, 16))}`;
}
