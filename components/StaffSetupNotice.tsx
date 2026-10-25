import { hasDatabase } from "@/lib/db";
import { isStaffConfigured, MIN_PASSWORD_LENGTH } from "@/lib/staffAuth";

export default function StaffSetupNotice() {
  return (
    <div className="survey-card">
      <h1>Khu vực chuyên viên chưa được cài đặt</h1>
      <p>Người quản lý web cần thêm trên Vercel (mục Settings → Environment Variables), rồi Redeploy:</p>
      <ul>
        {!hasDatabase() && (
          <li>
            Kết nối cơ sở dữ liệu Neon (mục Storage) để có biến <code>DATABASE_URL</code>.
          </li>
        )}
        {!isStaffConfigured() && (
          <li>
            Biến <code>STAFF_PASSWORD</code>: mật khẩu cho chuyên viên, ít nhất {MIN_PASSWORD_LENGTH} ký tự.
          </li>
        )}
      </ul>
    </div>
  );
}
