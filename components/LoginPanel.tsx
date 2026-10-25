"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { GraduationCap, LockKeyhole, UserRound } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { staffLogin, studentLogin, studentRegister, type FormState } from "@/app/dang-nhap/actions";

export type LoginTab = "dang-nhap" | "dang-ky" | "chuyen-vien";

const TABS: { id: LoginTab; label: string; icon: typeof UserRound }[] = [
  { id: "dang-nhap", label: "Học sinh", icon: UserRound },
  { id: "dang-ky", label: "Tạo tài khoản", icon: GraduationCap },
  { id: "chuyen-vien", label: "Chuyên viên", icon: LockKeyhole },
];

export default function LoginPanel({ initialTab, next }: { initialTab: LoginTab; next?: string }) {
  const [tab, setTab] = useState<LoginTab>(initialTab);

  return (
    <div className="survey-card login-card">
      <div className="login-tabs" role="tablist" aria-label="Chọn cách đăng nhập">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`login-tab ${tab === id ? "is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            <Icon size={17} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      {tab === "dang-nhap" && <StudentLoginForm next={next} onRegister={() => setTab("dang-ky")} />}
      {tab === "dang-ky" && <StudentRegisterForm next={next} />}
      {tab === "chuyen-vien" && <StaffLoginForm />}
    </div>
  );
}

// Gửi form mà không để React tự xóa các ô đã nhập, để khi báo lỗi em chỉ cần sửa chỗ sai.
function useLoginAction(fn: (prev: FormState, form: FormData) => Promise<FormState>) {
  const [state, action, pending] = useActionState<FormState, FormData>(fn, {});
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    startTransition(() => action(form));
  }
  return { state, pending, onSubmit };
}

function ErrorText({ state }: { state: FormState }) {
  return state.error ? (
    <p className="survey-missing" role="alert">
      {state.error}
    </p>
  ) : null;
}

function StudentLoginForm({ next, onRegister }: { next?: string; onRegister: () => void }) {
  const { state, pending, onSubmit } = useLoginAction(studentLogin);
  return (
    <form onSubmit={onSubmit} className="login-form">
      <p className="survey-muted">Đăng nhập để xem lại kết quả các lần khảo sát của em.</p>
      {next && <input type="hidden" name="next" value={next} />}
      <label htmlFor="hs-nickname">Biệt danh của em</label>
      <input id="hs-nickname" name="nickname" className="survey-text" autoComplete="username" required />
      <label htmlFor="hs-password">Mật khẩu</label>
      <PasswordInput id="hs-password" name="password" autoComplete="current-password" />
      <ErrorText state={state} />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Đang kiểm tra…" : "Đăng nhập"}
      </button>
      <p className="survey-muted small">
        Chưa có tài khoản?{" "}
        <button type="button" className="link-button" onClick={onRegister}>
          Tạo tài khoản
        </button>
      </p>
    </form>
  );
}

function StudentRegisterForm({ next }: { next?: string }) {
  const { state, pending, onSubmit } = useLoginAction(studentRegister);
  return (
    <form onSubmit={onSubmit} className="login-form">
      <p className="survey-muted">
        Tài khoản giúp em lưu và xem lại kết quả các lần khảo sát. Em <strong>không cần</strong> ghi họ tên thật, chỉ
        cần một biệt danh em nhớ được. Chuyên viên không thấy biệt danh của em.
      </p>
      {next && <input type="hidden" name="next" value={next} />}
      <label htmlFor="dk-nickname">Nhập biệt danh của em</label>
      <input
        id="dk-nickname"
        name="nickname"
        className="survey-text"
        autoComplete="username"
        minLength={3}
        maxLength={30}
        placeholder="Ví dụ: MèoMướp2009"
        required
      />
      <label htmlFor="dk-password">Mật khẩu (ít nhất 8 ký tự)</label>
      <PasswordInput id="dk-password" name="password" autoComplete="new-password" minLength={8} />
      <label htmlFor="dk-password2">Nhập lại mật khẩu</label>
      <PasswordInput id="dk-password2" name="password2" autoComplete="new-password" minLength={8} />
      <ErrorText state={state} />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Đang tạo…" : "Tạo tài khoản"}
      </button>
      <p className="survey-muted small">
        Web không hỏi email hay số điện thoại, nên nếu quên mật khẩu thì không lấy lại được. Em hãy ghi nhớ cẩn thận nhé.
      </p>
    </form>
  );
}

function StaffLoginForm() {
  const { state, pending, onSubmit } = useLoginAction(staffLogin);
  return (
    <form onSubmit={onSubmit} className="login-form">
      <p className="survey-muted">Dành cho chuyên viên tư vấn tâm lý của trường, để xem phiếu khảo sát của học sinh.</p>
      <label htmlFor="cv-password">Mật khẩu chuyên viên</label>
      <PasswordInput id="cv-password" name="password" autoComplete="current-password" />
      <ErrorText state={state} />
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Đang kiểm tra…" : "Đăng nhập"}
      </button>
    </form>
  );
}
