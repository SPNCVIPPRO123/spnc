import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Khu vực chuyên viên chứa dữ liệu nhạy cảm của học sinh: không lưu bộ nhớ đệm, không cho lập chỉ mục,
  // không gửi địa chỉ trang sang web khác.
  async headers() {
    return [
      {
        source: "/chuyen-vien/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
