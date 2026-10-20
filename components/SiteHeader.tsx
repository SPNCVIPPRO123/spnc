"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, MessageCircleHeart, X } from "lucide-react";
import { OpenChatButton } from "@/components/ChatWidget";
import { LogoMark } from "@/components/Logo";
import { siteConfig } from "@/lib/siteConfig";

const NAV_LINKS = [
  { href: "/#tim-hieu", label: "Tìm hiểu" },
  { href: "/#chu-de", label: "Chủ đề" },
  { href: siteConfig.surveyPath, label: "Khảo sát nhanh" },
  { href: siteConfig.counselingPath, label: "Tham vấn" },
  { href: "/#hoi-dap", label: "Hỏi đáp" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Đóng menu điện thoại khi chuyển trang.
  useEffect(() => setMenuOpen(false), [pathname]);

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
