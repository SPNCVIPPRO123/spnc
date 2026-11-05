"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, MessageCircleHeart, UserRound, X } from "lucide-react";
import { logoutEverywhere } from "@/app/dang-nhap/actions";
import { OpenChatButton } from "@/components/ChatWidget";
import { LogoMark } from "@/components/Logo";
import { siteConfig } from "@/lib/siteConfig";

const NAV_LINKS = [
  { href: "/#tim-hieu", label: "Tìm hiểu" },
  { href: siteConfig.surveyPath, label: "Khảo sát nhanh" },
  { href: siteConfig.counselingPath, label: "Tham vấn" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/#hoi-dap", label: "Hỏi đáp" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Ai đang đăng nhập (học sinh: biệt danh; chuyên viên: true). Hỏi lại máy chủ mỗi khi chuyển trang,
  // vì đăng nhập và đăng xuất đều chuyển sang trang khác.
  const [session, setSession] = useState<{ student: string | null; staff: boolean } | null>(null);

  // Đóng menu điện thoại khi chuyển trang.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    let alive = true;
    fetch("/api/phien", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => alive && setSession(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  const loggedIn = session !== null && (session.staff || session.student !== null);

  function onLogout() {
    setMenuOpen(false);
    setSession(null);
    // Máy dùng chung: xóa luôn câu trả lời khảo sát còn lưu tạm trong tab.
    try {
      for (const key of Object.keys(sessionStorage)) if (key.startsWith("khao-sat")) sessionStorage.removeItem(key);
    } catch {}
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand" aria-label={`${siteConfig.siteName} – trang chủ`}>
          <LogoMark />
          <span>
            <strong>{siteConfig.siteName}</strong>
            <small>Tâm lý học đường</small>
          </span>
        </Link>

        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Điều hướng chính">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          {loggedIn ? (
            <span className="nav-account">
              {session.staff ? (
                <Link href="/chuyen-vien" className="nav-staff" onClick={() => setMenuOpen(false)}>
                  <LayoutDashboard size={15} aria-hidden="true" /> Chuyên viên
                </Link>
              ) : (
                <Link href="/tai-khoan" className="nav-staff" onClick={() => setMenuOpen(false)}>
                  <UserRound size={15} aria-hidden="true" /> {session.student}
                </Link>
              )}
              <form action={logoutEverywhere} onSubmit={onLogout}>
                <button type="submit" className="nav-logout">
                  <LogOut size={15} aria-hidden="true" /> Đăng xuất
                </button>
              </form>
            </span>
          ) : (
            <Link href="/dang-nhap" className="nav-staff" onClick={() => setMenuOpen(false)}>
              <UserRound size={15} aria-hidden="true" /> Đăng nhập
            </Link>
          )}
          <OpenChatButton className="btn btn-primary btn-sm nav-cta">
            <MessageCircleHeart size={18} aria-hidden="true" /> Trò chuyện ngay
          </OpenChatButton>
        </nav>

        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
