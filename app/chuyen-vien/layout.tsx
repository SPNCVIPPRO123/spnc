import type { Metadata } from "next";
import type { ReactNode } from "react";

// Khu vực riêng cho chuyên viên: không cho công cụ tìm kiếm lập chỉ mục.
export const metadata: Metadata = {
  title: "Khu vực chuyên viên",
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <section className="section staff-section">
      <div className="container staff-shell">{children}</div>
    </section>
  );
}
