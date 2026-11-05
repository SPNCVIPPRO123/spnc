// Cấu hình phòng gọi video của lịch hẹn trực tuyến. File này dùng chung cho trình duyệt và máy chủ,
// nên không được chứa dữ liệu bí mật.

import { BOOKING } from "@/lib/booking";

export const CALL = {
  // Phòng mở trước giờ hẹn bao nhiêu phút (để kiểm tra camera, micro).
  opensMinutesBefore: 10,
  // Phòng còn mở sau khi hết giờ hẹn bao nhiêu phút (phòng khi buổi tư vấn kéo dài).
  closesMinutesAfterEnd: 30,
};

export type CallRole = "hs" | "cv";

export function callWindow(startsAt: string | Date): { opens: number; closes: number } {
  const start = new Date(startsAt).getTime();
  return {
    opens: start - CALL.opensMinutesBefore * 60_000,
    closes: start + (BOOKING.durationMinutes + CALL.closesMinutesAfterEnd) * 60_000,
  };
}

export type CallTiming = "som" | "mo" | "het";

export function callTiming(startsAt: string | Date, now = Date.now()): CallTiming {
  const w = callWindow(startsAt);
  return now < w.opens ? "som" : now > w.closes ? "het" : "mo";
}

// Giờ mở phòng theo giờ Việt Nam, ví dụ "18:20".
export function opensAtLabel(startsAt: string | Date): string {
  const t = new Date(callWindow(startsAt).opens + 7 * 3600_000).toISOString();
  return t.slice(11, 16);
}
