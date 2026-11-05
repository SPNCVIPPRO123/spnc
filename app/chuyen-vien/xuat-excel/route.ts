import { hasDatabase } from "@/lib/db";
import { isStaff } from "@/lib/staffAuth";
import { exportSubmissions } from "@/lib/staffData";
import { supportLevel } from "@/lib/supportLevel";
import { DASS_INFO, LEVEL_LABELS, scoreDass, worries, type DassKey } from "@/lib/survey";
import { buildXlsx } from "@/lib/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// File Excel tổng hợp cho chuyên viên: ai để lại liên lạc, mức độ cần hỗ trợ và các điểm nổi bật.
// /chuyen-vien/xuat-excel            → chỉ phiếu có để lại liên lạc
// /chuyen-vien/xuat-excel?loai=tat-ca → mọi phiếu

const TZ = "Asia/Ho_Chi_Minh";

function time(v: string | Date | null | undefined): string {
  if (!v) return "";
  return new Date(v).toLocaleString("vi-VN", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
}

export async function GET(req: Request) {
  if (!hasDatabase() || !(await isStaff())) return new Response("Chưa đăng nhập chuyên viên", { status: 401 });

  const all = new URL(req.url).searchParams.get("loai") === "tat-ca";
  const rows = await exportSubmissions(!all);
  const dassKeys = Object.keys(DASS_INFO) as DassKey[];

  const header = [
    "Mức độ",
    "Liên lạc học sinh để lại",
    "Để lại ở đâu",
    "Biệt danh",
    "Lớp",
    "Gửi lúc",
    "Để lại liên lạc lúc",
    ...dassKeys.map((k) => DASS_INFO[k].name),
    "Lĩnh vực bận lòng",
    "Cảnh báo",
    "Trạng thái",
    "Mã phiếu",
  ];

  const data = rows.map((r) => {
    const dass = scoreDass(r.answers);
    const level = supportLevel(r.answers);
    const alerts = [
      r.urgent && "KHẨN: C5 trả lời “Có”",
      r.safety && !r.urgent && "Phần 8 (an toàn)",
      r.protection && "Có thể bị bạo lực/xâm hại",
    ].filter(Boolean);
    return [
      r.urgent ? "Khẩn cấp" : level.high ? "Cần liên hệ sớm" : "Bình thường",
      r.contact ?? "",
      r.contact ? (r.contact_later ? "Khung mời sau kết quả" : "Cuối phiếu") : "",
      r.nickname ?? "",
      String(r.answers.A1 ?? ""),
      time(r.created_at),
      time(r.contact_at),
      ...dassKeys.map((k) => LEVEL_LABELS[dass[k].level]),
      worries(r.answers)
        .map((w) => w.area)
        .join(", "),
      alerts.join("; "),
      r.status === "da-xu-ly" ? "Đã xử lý" : "Chưa xử lý",
      r.id,
    ];
  });

  // Ưu tiên: khẩn cấp → cần liên hệ sớm → bình thường; cùng mức thì phiếu mới trước.
  const rank = (v: string) => (v === "Khẩn cấp" ? 0 : v === "Cần liên hệ sớm" ? 1 : 2);
  data.sort((a, b) => rank(a[0]) - rank(b[0]));

  const file = buildXlsx(
    all ? "Tất cả phiếu" : "Liên lạc học sinh",
    header,
    data,
    [16, 34, 20, 16, 6, 16, 16, 16, 12, 12, 30, 28, 12, 38],
  );
  const date = new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
  const name = `${all ? "tat-ca-phieu" : "lien-lac-hoc-sinh"}-${date}.xlsx`;

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
