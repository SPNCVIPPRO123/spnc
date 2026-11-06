import { hasDatabase } from "@/lib/db";
import { isStaffConfigured, MIN_PASSWORD_LENGTH } from "@/lib/staffAuth";

export default function StaffSetupNotice() {
  // Hướng dẫn cài đặt chi tiết (DATABASE_URL, STAFF_PASSWORD) nằm trong README, không hiện ra giao diện.
  return (
    <div className="survey-card">
      <h1>Khu vực chuyên viên chưa được cài đặt</h1>
      <p>Trang này cần được người quản lý web cài đặt thêm trước khi dùng:</p>
      <ul>
        {!hasDatabase() && <li>Chưa có nơi lưu phiếu khảo sát và lịch hẹn.</li>}
        {!isStaffConfigured() && <li>Chưa đặt mật khẩu cho chuyên viên. Mật khẩu cần dài ít nhất {MIN_PASSWORD_LENGTH} ký tự.</li>}
      </ul>
    </div>
  );
}
