// 8 cảm xúc của Nhật ký cảm xúc. Dùng chung cho máy chủ và trình duyệt.
// Mã (key) được lưu trong cơ sở dữ liệu: đừng đổi mã của cảm xúc đã có.

export const MOODS = [
  { key: "hao-huc", label: "Hào hứng", body: "#f7a9c6", shade: "#e98aae", soft: "#ffe9f1" },
  { key: "vui-ve", label: "Vui vẻ", body: "#ffd56e", shade: "#f2bb45", soft: "#fff5d6" },
  { key: "binh-yen", label: "Bình yên", body: "#ffc59d", shade: "#f4a878", soft: "#fff0e4" },
  { key: "binh-thuong", label: "Bình thường", body: "#c9b8f4", shade: "#ae9ae6", soft: "#f2edff" },
  { key: "met-moi", label: "Mệt mỏi", body: "#9298bd", shade: "#787ea5", soft: "#ebecf5" },
  { key: "buon", label: "Buồn", body: "#a3cdf3", shade: "#7fb2e4", soft: "#e9f3fd" },
  { key: "gian-du", label: "Giận dữ", body: "#f38a72", shade: "#e2694f", soft: "#ffe8e2" },
  { key: "lo-lang", label: "Lo lắng", body: "#93d8d0", shade: "#6cc0b6", soft: "#e4f7f4" },
] as const;

export type MoodKey = (typeof MOODS)[number]["key"];
export type Mood = (typeof MOODS)[number];

export const MOOD_BY_KEY = Object.fromEntries(MOODS.map((m) => [m.key, m])) as Record<MoodKey, Mood>;

export function isMoodKey(v: unknown): v is MoodKey {
  return typeof v === "string" && v in MOOD_BY_KEY;
}

// Những cảm xúc nặng nề: nếu gặp nhiều trong 7 ngày gần đây, trang sẽ nhẹ nhàng gợi ý em tìm người trò chuyện.
export const HEAVY_MOODS: readonly MoodKey[] = ["buon", "gian-du", "lo-lang"];

export const NOTE_MAX = 500;

export type MoodEntry = { day: string; mood: MoodKey; note: string };

// Ngày theo giờ Việt Nam, dạng YYYY-MM-DD.
export function vnToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(now);
}

export function isDay(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
