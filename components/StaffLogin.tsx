"use client";

import { useActionState } from "react";
import { LockKeyhole } from "lucide-react";
import { login, type LoginState } from "@/app/chuyen-vien/actions";

export default function StaffLogin() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="survey-card staff-login">
      <span className="page-hero-icon small">
        <LockKeyhole size={26} aria-hidden="true" />
      </span>
      <h1>Khu vực chuyên viên</h1>
      <p className="survey-muted">Trang này chứa phiếu khảo sát của học sinh, chỉ dành cho chuyên viên tư vấn tâm lý.</p>
      <label htmlFor="staff-password">Mật khẩu</label>
      <input
        id="staff-password"
        name="password"
        type="password"
        className="survey-text"
        autoComplete="current-password"
        required
      />
      {state.error && (
        <p className="survey-missing" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Đang kiểm tra…" : "Đăng nhập"}
      </button>
    </form>
  );
}
