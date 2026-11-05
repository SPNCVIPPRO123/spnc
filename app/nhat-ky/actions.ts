"use server";

import { deleteMood, saveMood } from "@/lib/moodDiary";
import { NOTE_MAX, isDay, isMoodKey, vnToday } from "@/lib/moods";
import { currentStudent } from "@/lib/studentAuth";

export type DiaryResult = { ok: true } | { ok: false; error: string };

const LOGGED_OUT = "Phiên đăng nhập đã hết. Em hãy đăng nhập lại nhé.";
const FAILED = "Chưa lưu được, em thử lại sau một chút nhé.";

export async function saveMoodEntry(day: unknown, mood: unknown, note: unknown): Promise<DiaryResult> {
  if (!isDay(day) || day > vnToday()) return { ok: false, error: "Chỉ ghi được cho hôm nay hoặc những ngày đã qua." };
  if (!isMoodKey(mood)) return { ok: false, error: "Em hãy chọn một cảm xúc." };
  const text = typeof note === "string" ? note.normalize("NFC").trim().slice(0, NOTE_MAX) : "";
  try {
    const student = await currentStudent();
    if (!student) return { ok: false, error: LOGGED_OUT };
    await saveMood(student.id, day, mood, text);
    return { ok: true };
  } catch {
    return { ok: false, error: FAILED };
  }
}

export async function deleteMoodEntry(day: unknown): Promise<DiaryResult> {
  if (!isDay(day)) return { ok: false, error: FAILED };
  try {
    const student = await currentStudent();
    if (!student) return { ok: false, error: LOGGED_OUT };
    await deleteMood(student.id, day);
    return { ok: true };
  } catch {
    return { ok: false, error: FAILED };
  }
}
