import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Be_Vietnam_Pro } from "next/font/google";
import ChatWidget from "@/components/ChatWidget";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { siteConfig } from "@/lib/siteConfig";
import "./globals.css";

// Phông chữ thiết kế riêng cho tiếng Việt, hiển thị dấu đẹp và rõ.
const font = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.siteName} – Tâm lý học đường`,
    template: `%s · ${siteConfig.siteName}`,
  },
  description: `Góc lắng nghe của học sinh ${siteConfig.schoolName}: tìm hiểu tâm lý học đường, khảo sát nhanh, tham vấn ẩn danh và trò chuyện với trợ lý AI.`,
};

export const viewport: Viewport = {
  themeColor: "#0c7a69",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className={font.className}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <ChatWidget />
      </body>
    </html>
  );
}
