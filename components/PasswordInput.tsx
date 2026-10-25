"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Ô mật khẩu có nút con mắt để xem lại mật khẩu vừa gõ.
export default function PasswordInput({
  id,
  name,
  autoComplete,
  minLength,
}: {
  id: string;
  name: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="password-field">
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        className="survey-text"
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={200}
        required
      />
      <button
        type="button"
        className="password-eye"
        aria-label={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={shown}
        onClick={() => setShown((v) => !v)}
      >
        {shown ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}
