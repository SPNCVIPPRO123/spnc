import { SCALES, SECTIONS, missingQuestions, visibleQuestions, type Answer, type Answers } from "@/lib/survey";

// Kiểm tra phiếu trước khi lưu (chạy trên máy chủ): chỉ giữ những câu có trên phiếu với đáp án hợp lệ,
// bỏ câu trả lời của câu điều kiện đang bị ẩn (C5, D3.11) và từ chối phiếu chưa trả lời đủ câu bắt buộc.

export const CONTACT_MAX = 200;
const OTHER_MAX = 200;

export function wantsContact(answers: Answers): boolean {
  return typeof answers["A6"] === "string" && answers["A6"].startsWith("Để lại");
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  // Bỏ ký tự điều khiển, gộp khoảng trắng.
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, max) : null;
}

export function sanitizeAnswers(raw: unknown): Answers | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const input = raw as Record<string, unknown>;
  const valid: Answers = {};

  for (const section of SECTIONS) {
    for (const group of section.groups) {
      for (const q of group.questions) {
        const v = input[q.id];
        if (v === undefined) continue;
        if (q.kind === "choice") {
          if (typeof v === "string" && q.options.includes(v)) valid[q.id] = v;
        } else if (q.kind === "scale") {
          if (typeof v === "number" && SCALES[q.scale].some((o) => o.value === v)) valid[q.id] = v;
        } else {
          const allowed = q.otherLabel ? [...q.options, q.otherLabel] : q.options;
          if (!Array.isArray(v)) continue;
          const picked = allowed.filter((opt) => v.includes(opt));
          if (picked.length === 0) continue;
          valid[q.id] = picked;
          if (q.otherLabel && picked.includes(q.otherLabel)) {
            const other = cleanText(input[`${q.id}_khac`], OTHER_MAX);
            if (other) valid[`${q.id}_khac`] = other;
          }
        }
      }
    }
  }

  const answers: Answers = {};
  for (const section of SECTIONS) {
    for (const q of visibleQuestions(section, valid)) {
      if (valid[q.id] !== undefined) answers[q.id] = valid[q.id] as Answer;
      if (valid[`${q.id}_khac`] !== undefined) answers[`${q.id}_khac`] = valid[`${q.id}_khac`];
    }
  }

  if (SECTIONS.some((s) => missingQuestions(s, answers).length > 0)) return null;
  return answers;
}

export function sanitizeContact(raw: unknown, answers: Answers): string | null {
  return wantsContact(answers) ? cleanText(raw, CONTACT_MAX) : null;
}
