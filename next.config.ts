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
      {
        // Phòng gọi video: không lưu bộ nhớ đệm, không lập chỉ mục, chỉ trang này của web được dùng camera và micro.
        source: "/goi-video/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
