import {
  DASS_INFO,
  LEVEL_LABELS,
  protectionConcern,
  safetyConcern,
  scoreDass,
  worries,
  type Answers,
  type DassKey,
} from "@/lib/survey";

// Sau khi gửi phiếu: quyết định nên mời học sinh để lại liên lạc theo kiểu "cần hỗ trợ sớm" hay kiểu nhẹ nhàng,
// và tóm tắt những điểm nổi bật bằng lời mềm mỏng (không dùng nhãn bệnh, không chẩn đoán).
// Dùng chung cho trang kết quả của học sinh và file Excel của chuyên viên, để hai bên thấy cùng một mức.

export type SupportLevel = {
  high: boolean; // nên để chuyên viên liên hệ sớm
  points: string[]; // những điểm nổi bật, viết cho học sinh đọc
};

// Mức 3–4 ("Cao", "Rất cao") là mức hiện màu đỏ trên trang kết quả.
const RED_LEVEL = 3;

export function supportLevel(answers: Answers): SupportLevel {
  const dass = scoreDass(answers);
  const keys = Object.keys(dass) as DassKey[];
  const red = keys.filter((k) => dass[k].level >= RED_LEVEL);
  const raised = keys.filter((k) => dass[k].level >= 2);
  const safety = safetyConcern(answers);
  const protection = protectionConcern(answers);
  const areas = worries(answers);

  const high = safety.flagged || protection || red.length > 0 || raised.length >= 2 || areas.length >= 3;

  const points: string[] = raised
    .sort((a, b) => dass[b].level - dass[a].level)
    .map((k) => `Cảm giác ${DASS_INFO[k].name.toLowerCase()} đang ở mức ${LEVEL_LABELS[dass[k].level].toLowerCase()}`);
  if (areas.length > 0) points.push(`Nhiều điều làm em bận lòng: ${areas.map((a) => a.area.toLowerCase()).join(", ")}`);
  if (protection) points.push("Có những chuyện khiến em sợ hãi hoặc bị tổn thương");
  if (safety.flagged) points.push("Có lúc em mang những suy nghĩ rất nặng nề");

  return { high, points };
}
