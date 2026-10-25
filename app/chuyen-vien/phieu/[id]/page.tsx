import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, LifeBuoy, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import StaffSetupNotice from "@/components/StaffSetupNotice";
import { AlertBadges, StatusBadge, formatTime } from "@/components/StaffBadges";
import { hasDatabase } from "@/lib/db";
import { isStaff, isStaffConfigured } from "@/lib/staffAuth";
import { getSubmission } from "@/lib/staffData";
import {
  DASS_INFO,
  LEVEL_LABELS,
  SAFETY_IDS,
  SCALES,
  SECTIONS,
  scoreDass,
  type Answers,
  type DassKey,
  type Question,
} from "@/lib/survey";
import { removeSubmission, setStatus } from "../../actions";

export const dynamic = "force-dynamic";

// Các câu về bạo lực, xâm hại (giống lib/survey.ts): tô đậm khi học sinh chọn từ "Hiếm khi" trở lên.
const PROTECTION_IDS = ["D2.7", "D3.8", "D3.9", "D3.10", "D4.12", "D4.13", "D5.7", "D5.8"];

function answerText(q: Question, answers: Answers): string | null {
  const v = answers[q.id];
  if (v === undefined) return null;
  if (q.kind === "scale") {
    const opt = SCALES[q.scale].find((o) => o.value === v);
    return opt ? `${opt.value} – ${opt.label}` : String(v);
  }
  if (q.kind === "multi" && Array.isArray(v)) {
    const other = answers[`${q.id}_khac`];
    return v.map((x) => (x === q.otherLabel && typeof other === "string" ? `${x}: ${other}` : x)).join("; ");
  }
  return String(v);
}

function isFlagged(q: Question, answers: Answers): boolean {
  const v = answers[q.id];
  if (SAFETY_IDS.includes(q.id)) return v === 1 || v === 9;
  if (q.id === "C5") return v === 1;
  if (PROTECTION_IDS.includes(q.id)) return typeof v === "number" && v >= 2;
  return false;
}

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase() || !isStaffConfigured()) return <StaffSetupNotice />;
  if (!(await isStaff())) redirect("/dang-nhap?vai=chuyen-vien");

  const { id } = await params;
  const row = await getSubmission(id);
  if (!row) notFound();

  const { answers } = row;
  const dass = scoreDass(answers);
  const flaggedSafety = [...SAFETY_IDS, "C5"].filter((qid) => answers[qid] === 1 || (qid !== "C5" && answers[qid] === 9));
  const flaggedProtection = PROTECTION_IDS.filter((qid) => typeof answers[qid] === "number" && (answers[qid] as number) >= 2);

  return (
    <>
      <Link href="/chuyen-vien" className="link-button staff-back">
        <ArrowLeft size={16} aria-hidden="true" /> Danh sách phiếu
      </Link>

      <div className="survey-card">
        <div className="staff-row-top">
          <h1>
            {row.nickname ? `${row.nickname} · ` : ""}Phiếu lớp {String(answers.A1 ?? "?")}
          </h1>
          <StatusBadge status={row.status} />
        </div>
        <p className="survey-muted">
          Gửi lúc {formatTime(row.created_at)}
          {new Date(row.updated_at).getTime() - new Date(row.created_at).getTime() > 1000 &&
            ` · học sinh sửa lại lúc ${formatTime(row.updated_at)}`}
        </p>
        <AlertBadges row={row} />
        <p className="survey-muted small">
          {row.nickname
            ? `Biệt danh “${row.nickname}” là tên học sinh tự đặt khi tạo tài khoản, không phải tên thật.`
            : "Học sinh gửi phiếu khi chưa đăng nhập tài khoản."}
        </p>
        <p className="staff-contact">
          {row.contact ? (
            <>
              Cách liên lạc học sinh để lại: <strong>{row.contact}</strong>
            </>
          ) : (
            "Học sinh chọn ẩn danh hoặc không để lại cách liên lạc."
          )}
        </p>
        <div className="staff-actions">
          <form action={setStatus}>
            <input type="hidden" name="id" value={row.id} />
            <input type="hidden" name="status" value={row.status === "moi" ? "da-xu-ly" : "moi"} />
            <button type="submit" className="btn btn-primary btn-sm">
              {row.status === "moi" ? (
                <>
                  <Check size={16} aria-hidden="true" /> Đánh dấu đã xử lý
                </>
              ) : (
                <>
                  <RotateCcw size={16} aria-hidden="true" /> Chuyển lại thành chưa xử lý
                </>
              )}
            </button>
          </form>
          <details className="staff-delete">
            <summary className="btn btn-outline btn-sm">
              <Trash2 size={16} aria-hidden="true" /> Xóa phiếu
            </summary>
            <form action={removeSubmission}>
              <input type="hidden" name="id" value={row.id} />
              <p>Xóa vĩnh viễn phiếu này? Không thể khôi phục.</p>
              <button type="submit" className="btn btn-sm staff-danger">
                Xóa vĩnh viễn
              </button>
            </form>
          </details>
        </div>
      </div>

      {flaggedSafety.length > 0 && (
        <div className={`result-alert ${row.urgent ? "is-urgent" : ""}`}>
          <LifeBuoy size={28} aria-hidden="true" />
          <div>
            <h3>{row.urgent ? "Học sinh trả lời đang nghĩ đến tự tử ngay lúc này (C5)" : "Cảnh báo ở Phần 8"}</h3>
            <p>
              Các câu được đánh dấu: {flaggedSafety.join(", ")}. Theo ghi chú của phiếu, “Không muốn trả lời” được tính như
              “Có”.
            </p>
          </div>
        </div>
      )}
      {flaggedProtection.length > 0 && (
        <div className="result-alert is-protect">
          <ShieldAlert size={28} aria-hidden="true" />
          <div>
            <h3>Có dấu hiệu bạo lực hoặc xâm hại</h3>
            <p>Các câu từ mức “Hiếm khi” trở lên: {flaggedProtection.join(", ")}.</p>
          </div>
        </div>
      )}

      <div className="survey-card">
        <h2 className="results-title">DASS-21 (Phần 3)</h2>
        <div className="staff-row-meta">
          {(Object.keys(dass) as DassKey[]).map((k) => (
            <span key={k} className={`dass-chip level-${dass[k].level}`}>
              {DASS_INFO[k].name}: {dass[k].score} điểm, {LEVEL_LABELS[dass[k].level]}
            </span>
          ))}
        </div>
      </div>

      {SECTIONS.map((section, si) => (
        <div className="survey-card" key={section.id}>
          <h2 className="results-title">
            Phần {si + 1}. {section.title}
          </h2>
          <dl className="staff-answers">
            {section.groups
              .flatMap((g) => g.questions)
              .filter((q) => answers[q.id] !== undefined || !q.showIf || q.showIf(answers))
              .map((q) => {
                const text = answerText(q, answers);
                return (
                  <div key={q.id} className={isFlagged(q, answers) ? "is-flagged" : undefined}>
                    <dt>
                      <b>{q.id}</b> {q.text}
                    </dt>
                    <dd>{text ?? <span className="survey-muted">(không chọn)</span>}</dd>
                  </div>
                );
              })}
          </dl>
        </div>
      ))}
    </>
  );
}
