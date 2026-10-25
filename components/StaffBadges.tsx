import type { SubmissionRow } from "@/lib/staffData";

export function formatTime(t: string | Date): string {
  return new Date(t).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function AlertBadges({ row }: { row: SubmissionRow }) {
  return (
    <span className="staff-badges">
      {row.urgent && <span className="staff-badge is-urgent">C5: đang nghĩ đến tự tử</span>}
      {row.safety && !row.urgent && <span className="staff-badge is-safety">Phần 8: cần chú ý</span>}
      {row.protection && <span className="staff-badge is-protect">Bạo lực, xâm hại</span>}
      {!row.urgent && !row.safety && !row.protection && <span className="staff-badge">Không có cảnh báo</span>}
    </span>
  );
}

export function StatusBadge({ status }: { status: SubmissionRow["status"] }) {
  return status === "da-xu-ly" ? (
    <span className="staff-badge is-done">Đã xử lý</span>
  ) : (
    <span className="staff-badge is-new">Mới</span>
  );
}
