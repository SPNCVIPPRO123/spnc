// Lớp an toàn thứ hai, chạy độc lập với AI: nếu tin nhắn của học sinh có từ khoá
// liên quan tới tự hại, tự tử hoặc bị bạo hành, giao diện sẽ luôn hiện khung số
// điện thoại khẩn cấp, kể cả khi AI trả lời chưa tốt.
// Đây chỉ là lưới an toàn đơn giản; nên nhờ chuyên viên tâm lý bổ sung từ khoá.

// Từ khoá có dấu.
const CRISIS_KEYWORDS = [
  "tự tử",
  "tự sát",
  "tự vẫn",
  "tự hại",
  "tự làm đau",
  "tự làm hại",
  "muốn chết",
  "chết đi cho xong",
  "không muốn sống",
  "chán sống",
  "kết thúc cuộc đời",
  "kết liễu",
  "rạch tay",
  "cắt tay",
  "nhảy lầu",
  "nhảy cầu",
  "uống thuốc ngủ",
  "bị bạo hành",
  "bị xâm hại",
  "bị hiếp",
  "bị quấy rối",
  "bị đánh đập",
];

// Từ khoá viết không dấu. Chỉ dùng cụm từ dài, vì cụm ngắn dễ bị nhầm
// (ví dụ "tu tu" vừa có thể là "tự tử" vừa có thể là "từ từ").
const CRISIS_KEYWORDS_NO_DIACRITICS = [
  "tu sat",
  "muon chet",
  "khong muon song",
  "ko muon song",
  "k muon song",
  "hong muon song",
  "chang muon song",
  "tu lam dau",
  "chan song",
  "rach tay",
  "nhay lau",
  "bi bao hanh",
  "bi xam hai",
];

function normalize(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\s+/g, " ");
}

function removeDiacritics(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

export function detectCrisis(text: string): boolean {
  const normalized = normalize(text);
  if (CRISIS_KEYWORDS.some((k) => normalized.includes(k))) return true;

  const plain = ` ${removeDiacritics(normalized).replace(/[^a-z0-9]+/g, " ")} `;
  return CRISIS_KEYWORDS_NO_DIACRITICS.some((k) => plain.includes(` ${k} `));
}
