"use server";

import { redirect } from "next/navigation";
import { clearStaffCookie, isStaff } from "@/lib/staffAuth";
import { deleteSubmission, updateStatus, type Status } from "@/lib/staffData";
import { STAFF_NOTE_MAX, type AppointmentStatus } from "@/lib/booking";
import { openCallNow, setAppointmentStatus } from "@/lib/bookingData";

export async function logout() {
  await clearStaffCookie();
  redirect("/dang-nhap?vai=chuyen-vien");
}

export async function setStatus(form: FormData) {
  if (!(await isStaff())) redirect("/chuyen-vien");
  const id = String(form.get("id") ?? "");
  const status = form.get("status") === "da-xu-ly" ? "da-xu-ly" : ("moi" as Status);
  await updateStatus(id, status);
  redirect(`/chuyen-vien/phieu/${encodeURIComponent(id)}`);
}

export async function removeSubmission(form: FormData) {
  if (!(await isStaff())) redirect("/chuyen-vien");
  await deleteSubmission(String(form.get("id") ?? ""));
  redirect("/chuyen-vien");
}

export async function updateAppointment(form: FormData) {
  if (!(await isStaff())) redirect("/chuyen-vien");
  const id = String(form.get("id") ?? "");
  const raw = form.get("status");
  const status: AppointmentStatus | null =
    raw === "xac-nhan" || raw === "huy" || raw === "xong" ? raw : null;
  const note = String(form.get("staff_note") ?? "").replace(/\s+/g, " ").trim().slice(0, STAFF_NOTE_MAX);
  if (status) await setAppointmentStatus(id, status, note || null);
  const back = String(form.get("loc") ?? "");
  redirect(`/chuyen-vien/lich-hen${/^[a-z-]+$/.test(back) ? `?loc=${back}` : ""}`);
}

// Mở phòng gọi video ngay (không chờ giờ hẹn), rồi vào phòng luôn.
export async function openCallNowAction(form: FormData) {
  if (!(await isStaff())) redirect("/chuyen-vien");
  const id = String(form.get("id") ?? "");
  await openCallNow(id);
  redirect(`/goi-video/${encodeURIComponent(id)}?vai=cv`);
}
