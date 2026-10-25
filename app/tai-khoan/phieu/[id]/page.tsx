import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SurveyResults from "@/components/SurveyResults";
import { currentStudent, ownSubmission } from "@/lib/studentAuth";
import type { Answers } from "@/lib/survey";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kết quả khảo sát", robots: { index: false, follow: false } };

export default async function OwnResultPage({ params }: { params: Promise<{ id: string }> }) {
  const student = await currentStudent();
  if (!student) redirect("/dang-nhap?next=/tai-khoan");
  const { id } = await params;
  const row = await ownSubmission(student.id, id);
  if (!row) notFound();

  return (
    <section className="section survey-section">
      <div className="container survey-shell">
        <Link href="/tai-khoan" className="link-button staff-back">
          <ArrowLeft size={16} aria-hidden="true" /> Tài khoản của em
        </Link>
        <SurveyResults
          answers={row.answers as Answers}
          sent
          date={new Date(row.created_at).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
        />
      </div>
    </section>
  );
}
