"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardList, FlaskConical, Lock, Phone, ShieldCheck } from "lucide-react";
import SurveyResults from "@/components/SurveyResults";
import SurveySubmit, { clearSent, loadSent } from "@/components/SurveySubmit";
import { siteConfig } from "@/lib/siteConfig";
import {
  SCALES,
  SECTIONS,
  dropHiddenAnswers,
  missingQuestions,
  visibleQuestions,
  type Answer,
  type Answers,
  type Question,
} from "@/lib/survey";

type Step = "intro" | "declined" | "submit" | "results" | number;

// Câu trả lời đang làm dở được lưu tạm trong tab trình duyệt đang mở (mất khi đóng tab).
// Phiếu chỉ được gửi tới chuyên viên khi em bấm gửi ở bước cuối (components/SurveySubmit.tsx).
const STORAGE_KEY = "khao-sat-nhanh-v1";

function loadSaved(): { step: Step; answers: Answers } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(step: Step, answers: Answers) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers }));
  } catch {
    // Trình duyệt chặn lưu tạm: vẫn làm khảo sát bình thường.
  }
}

function clearSaved() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function Survey({ nickname }: { nickname?: string }) {
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<Answers>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [restored, setRestored] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadSaved();
    if (saved && saved.step !== "intro") {
      setStep(saved.step);
      setAnswers(dropHiddenAnswers(saved.answers));
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored) save(step, answers);
  }, [step, answers, restored]);

  function goTo(next: Step) {
    setMissing([]);
    setStep(next);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function setAnswer(id: string, value: Answer | undefined) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[id];
      else next[id] = value;
      return dropHiddenAnswers(next);
    });
    setMissing((m) => m.filter((x) => x !== id));
  }

  function restart() {
    clearSaved();
    clearSent();
    setAnswers({});
    goTo("intro");
  }

  function next(index: number) {
    const miss = missingQuestions(SECTIONS[index], answers);
    if (miss.length > 0) {
      setMissing(miss);
      document.getElementById(`q-${miss[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    goTo(index + 1 < SECTIONS.length ? index + 1 : "submit");
  }

  if (!restored) return <div className="survey-shell" ref={topRef} />;

  return (
    <div className="survey-shell" ref={topRef}>
      {step === "intro" && <Intro onAgree={() => goTo(0)} onDecline={() => goTo("declined")} />}

      {step === "declined" && (
        <div className="survey-card survey-center">
          <h2>Cảm ơn bạn đã ghé qua 💛</h2>
          <p>Bạn có thể quay lại làm khảo sát bất cứ lúc nào. Nếu cần ai đó lắng nghe, Bạn Đồng Hành luôn ở đây.</p>
          <button type="button" className="btn btn-outline" onClick={() => goTo("intro")}>
            Quay lại trang giới thiệu
          </button>
        </div>
      )}

      {typeof step === "number" && (
        <SectionStep
          index={step}
          answers={answers}
          missing={missing}
          onAnswer={setAnswer}
          onBack={() => goTo(step === 0 ? "intro" : step - 1)}
          onNext={() => next(step)}
        />
      )}

      {step === "submit" && (
        <SurveySubmit
          answers={answers}
          nickname={nickname}
          onBack={() => goTo(SECTIONS.length - 1)}
          onDone={(sent) => {
            setSendFailed(!sent);
            goTo("results");
          }}
        />
      )}

      {step === "results" && (
        <SurveyResults
          answers={answers}
          sent={!sendFailed && loadSent() !== null}
          onEdit={() => goTo(0)}
          onRestart={restart}
        />
      )}
    </div>
  );
}

function Intro({ onAgree, onDecline }: { onAgree: () => void; onDecline: () => void }) {
  return (
    <div className="survey-card survey-intro">
      <span className="survey-badge">
        <FlaskConical size={15} aria-hidden="true" /> Bản thử nghiệm
      </span>
      <h2>Phiếu khảo sát cảm xúc và nhu cầu hỗ trợ tâm lý của học sinh</h2>
      <p>
        Chào em! Phiếu này giúp em hiểu rõ hơn cảm xúc của mình và biết nên tìm sự hỗ trợ ở đâu. Không có câu trả lời
        đúng hay sai, và em có thể dừng bất cứ lúc nào.
      </p>
      <ul className="survey-facts">
        <li>
          <ClipboardList size={18} aria-hidden="true" /> 9 phần, khoảng 15–20 phút.
        </li>
        <li>
          <Lock size={18} aria-hidden="true" /> Phiếu không hỏi họ tên. Khi em bấm gửi ở cuối phiếu, câu trả lời được
          chuyển tới <strong>chuyên viên tư vấn tâm lý của trường</strong> để hỗ trợ em khi cần. Bạn bè, bố mẹ hay thầy
          cô khác không xem được. Em có thể chọn ẩn danh hoàn toàn hoặc để lại cách liên lạc.
        </li>
        <li>
          <ShieldCheck size={18} aria-hidden="true" /> Kết quả chỉ để tham khảo, không phải chẩn đoán. Nếu cần, em có thể
          in kết quả để mang tới chuyên viên tư vấn.
        </li>
      </ul>
      <p className="survey-muted">
        Bộ câu hỏi đang trong giai đoạn thử nghiệm và cần thêm thời gian kiểm nghiệm. Nếu em đang gặp nguy hiểm, đừng chờ
        kết quả, hãy gọi ngay <a href="tel:111">111</a> hoặc nói với một người lớn em tin tưởng.
      </p>
      <div className="survey-consent">
        <button type="button" className="btn btn-primary btn-lg" onClick={onAgree}>
          Em đã đọc và đồng ý tham gia <ArrowRight size={18} aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-outline btn-lg" onClick={onDecline}>
          Em không đồng ý tham gia
        </button>
      </div>
      <p className="survey-muted small">Trường: {siteConfig.schoolName}</p>
    </div>
  );
}

function SectionStep({
  index,
  answers,
  missing,
  onAnswer,
  onBack,
  onNext,
}: {
  index: number;
  answers: Answers;
  missing: string[];
  onAnswer: (id: string, value: Answer | undefined) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const section = SECTIONS[index];
  const total = SECTIONS.length;
  const visible = new Set(visibleQuestions(section, answers).map((q) => q.id));
  let counter = 0;

  return (
    <div className="survey-step">
      <div className="survey-progress" aria-label={`Phần ${index + 1} trên ${total}`}>
        <div className="survey-progress-text">
          <span>
            Phần {index + 1}/{total}
          </span>
          <span>{Math.round(((index + 1) / total) * 100)}%</span>
        </div>
        <div className="survey-progress-bar">
          <span style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="survey-card">
        <h2 className="survey-section-title">
          Phần {index + 1}. {section.title}
        </h2>
        {section.intro && <p className="survey-section-intro">{section.intro}</p>}
        {section.scale && <ScaleLegend scale={section.scale} />}

        {section.groups.map((group, gi) => (
          <div className="survey-group" key={gi}>
            {group.heading && <h3 className="survey-group-heading">{group.heading}</h3>}
            {group.questions
              .filter((q) => visible.has(q.id))
              .map((q) => (
                <QuestionField
                  key={q.id}
                  number={++counter}
                  question={q}
                  answers={answers}
                  missing={missing.includes(q.id)}
                  onAnswer={onAnswer}
                />
              ))}
          </div>
        ))}

        {section.id === "p8" && (
          <div className="survey-support">
            <Phone size={20} aria-hidden="true" />
            <p>
              Nếu em đang có những suy nghĩ này, em không phải chịu đựng một mình. Hãy nói ngay với thầy cô, chuyên viên
              tư vấn hoặc một người lớn em tin. Phòng tư vấn của trường: {siteConfig.counselingRoom}. Tổng đài quốc gia
              bảo vệ trẻ em: <a href="tel:111">111</a>. Nếu đang gặp nguy hiểm: gọi <a href="tel:115">115</a>.
            </p>
          </div>
        )}

        {section.note && <p className="survey-muted small">{section.note}</p>}
      </div>

      {missing.length > 0 && (
        <p className="survey-missing" role="alert">
          Bạn còn {missing.length} câu chưa trả lời (đánh dấu viền đỏ).
        </p>
      )}

      <div className="survey-nav">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" /> Quay lại
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          {index + 1 < total ? "Tiếp tục" : "Hoàn thành"} <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function ScaleLegend({ scale }: { scale: keyof typeof SCALES }) {
  return (
    <p className="survey-legend">
      {SCALES[scale].map((o) => (
        <span key={o.value}>
          <b>{o.value}</b> = {o.label}
        </span>
      ))}
    </p>
  );
}

function QuestionField({
  number,
  question: q,
  answers,
  missing,
  onAnswer,
}: {
  number: number;
  question: Question;
  answers: Answers;
  missing: boolean;
  onAnswer: (id: string, value: Answer | undefined) => void;
}) {
  const value = answers[q.id];

  return (
    <fieldset id={`q-${q.id}`} className={`survey-q ${missing ? "is-missing" : ""} ${value !== undefined ? "is-done" : ""}`}>
      <legend>
        <span className="survey-q-num">{number}</span>
        {q.text}
      </legend>

      {q.kind === "choice" && (
        <div className="survey-options">
          {q.options.map((opt) => (
            <label key={opt} className="survey-opt">
              <input type="radio" name={q.id} checked={value === opt} onChange={() => onAnswer(q.id, opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {q.kind === "scale" && (
        <div className={`survey-scale cols-${SCALES[q.scale].length}`}>
          {SCALES[q.scale].map((o) => (
            <label key={o.value} className="survey-scale-opt">
              <input type="radio" name={q.id} checked={value === o.value} onChange={() => onAnswer(q.id, o.value)} />
              <span>
                {"short" in o ? (
                  <>
                    <b>{o.value}</b>
                    <small>{o.short}</small>
                  </>
                ) : (
                  <b className="text">{o.label}</b>
                )}
              </span>
            </label>
          ))}
        </div>
      )}

      {q.kind === "multi" && (
        <MultiField question={q} answers={answers} onAnswer={onAnswer} />
      )}
    </fieldset>
  );
}

function MultiField({
  question: q,
  answers,
  onAnswer,
}: {
  question: Extract<Question, { kind: "multi" }>;
  answers: Answers;
  onAnswer: (id: string, value: Answer | undefined) => void;
}) {
  const selected = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
  const otherId = `${q.id}_khac`;
  const options = q.otherLabel ? [...q.options, q.otherLabel] : q.options;

  function toggle(opt: string) {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onAnswer(q.id, next.length ? next : undefined);
    if (opt === q.otherLabel && selected.includes(opt)) onAnswer(otherId, undefined);
  }

  return (
    <>
      <div className="survey-options">
        {options.map((opt) => (
          <label key={opt} className="survey-opt is-check">
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      {q.otherLabel && selected.includes(q.otherLabel) && (
        <input
          className="survey-text"
          type="text"
          maxLength={200}
          placeholder="Em ghi thêm ở đây (không bắt buộc)"
          value={typeof answers[otherId] === "string" ? (answers[otherId] as string) : ""}
          onChange={(e) => onAnswer(otherId, e.target.value || undefined)}
        />
      )}
    </>
  );
}
