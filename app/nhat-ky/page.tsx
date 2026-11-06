import { redirect } from "next/navigation";
import MoodDiary from "@/components/MoodDiary";
import { moodEntries } from "@/lib/moodDiary";
import { addDays, vnToday } from "@/lib/moods";
import { currentStudent } from "@/lib/studentAuth";
import "./nhat-ky.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nhật ký cảm xúc", robots: { index: false, follow: false } };

function lastDayOfMonth(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

export default async function DiaryPage({ searchParams }: { searchParams: Promise<{ thang?: string }> }) {
  const student = await currentStudent();
  if (!student) redirect("/dang-nhap?next=/nhat-ky");

  const today = vnToday();
  const thisMonth = today.slice(0, 7);
  const { thang } = await searchParams;
  // Tháng đang xem: ?thang=2026-11. Không cho xem tháng sau tháng hiện tại.
  const month = typeof thang === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(thang) && thang <= thisMonth ? thang : thisMonth;
  const [y, m] = month.split("-").map(Number);

  const entries = await moodEntries(student.id, [
    [`${month}-01`, lastDayOfMonth(y, m)],
    [addDays(today, -6), today],
  ]);

  return (
    <section className="section diary-section">
      <div className="container diary-shell">
        <div className="diary-intro">
          <h1>Nhật ký cảm xúc của {student.nickname}</h1>
          <p className="survey-muted">
            Mỗi ngày, em chọn một bạn nhỏ giống tâm trạng của mình và viết thêm vài dòng nếu thích. Nhật ký chỉ ghi cho
            hôm nay, còn những ngày trước em mở ra xem lại được. Chỉ mình em đọc được nhật ký này, chuyên viên hay thầy
            cô đều không xem được.
          </p>
        </div>
        <MoodDiary key={month} month={month} today={today} initialEntries={entries} />
      </div>
    </section>
  );
}
