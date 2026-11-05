"use server";

import { redirect } from "next/navigation";
import { CONTACT_MAX, NOTE_MAX, BOOKING, isBookable, slotStart, type Mode } from "@/lib/booking";
import { bookAppointment, cancelOwnAppointment } from "@/lib/bookingData";
import { currentStudent } from "@/lib/studentAuth";

export type BookState = { error?: string };

function text(form: FormData, name: string, max: number): string | null | false {
  const v = form.get(name);
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > max ? false : t;
}

export async function book(_prev: BookState, form: FormData): Promise<BookState> {
  const student = await currentStudent();
  if (!student) redirect("/dang-nhap?next=/dat-lich");

  const mode = form.get("mode");
  if (mode !== "online" && mode !== "offline") return { error: "Em chọn hình thức tư vấn: trực tuyến hay gặp trực tiếp nhé." };
  const date = String(form.get("date") ?? "");
  const time = String(form.get("time") ?? "");
  if (!date || !time) return { error: "Em chọn ngày và giờ hẹn nhé." };
  if (!isBookable(date, time)) return { error: "Khung giờ này không còn đặt được. Em chọn giờ khác nhé." };

  const contact = text(form, "contact", CONTACT_MAX);
  if (contact === false) return { error: `Cách liên lạc dài tối đa ${CONTACT_MAX} ký tự.` };
  const note = text(form, "note", NOTE_MAX);
  if (note === false) return { error: `Lời nhắn dài tối đa ${NOTE_MAX} ký tự.` };

  const result = await bookAppointment(student.id, slotStart(date, time), mode as Mode, contact, note);
  if (result === "full") return { error: "Vừa có bạn khác đặt khung giờ này. Em chọn giờ khác nhé." };
  if (result === "duplicate") return { error: "Em đã đặt khung giờ này rồi." };
  if (result === "limit")
    return {
      error: `Em đang có ${BOOKING.maxActivePerStudent} lịch hẹn chưa diễn ra. Hãy hủy bớt một lịch nếu muốn đặt giờ khác.`,
    };
  redirect("/dat-lich?da-dat=1");
}

export async function cancelBooking(form: FormData) {
  const student = await currentStudent();
  if (!student) redirect("/dang-nhap?next=/dat-lich");
  await cancelOwnAppointment(student.id, String(form.get("id") ?? ""));
  redirect("/dat-lich");
}
