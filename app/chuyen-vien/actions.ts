"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, COOKIE_PATH, isStaff } from "@/lib/staffAuth";
import { deleteSubmission, updateStatus, type Status } from "@/lib/staffData";

export async function logout() {
  (await cookies()).delete({ name: COOKIE_NAME, path: COOKIE_PATH });
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
