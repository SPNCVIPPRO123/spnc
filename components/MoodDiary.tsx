"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { BarChart3, CalendarHeart, ChevronLeft, ChevronRight, Lock, MessageCircleHeart, Trash2 } from "lucide-react";
import { deleteMoodEntry, saveMoodEntry } from "@/app/nhat-ky/actions";
import { OpenChatButton } from "@/components/ChatWidget";
import MoodBlob from "@/components/MoodBlob";
import { HEAVY_MOODS, MOODS, MOOD_BY_KEY, NOTE_MAX, addDays, type MoodEntry, type MoodKey } from "@/lib/moods";
import { siteConfig } from "@/lib/siteConfig";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAY_NAMES = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];

function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

function dayTitle(day: string, today: string): string {
  if (day === today) return "Hôm nay";
  if (day === addDays(today, -1)) return "Hôm qua";
  const d = new Date(`${day}T00:00:00Z`);
  return `${WEEKDAY_NAMES[d.getUTCDay()]}, ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

export default function MoodDiary({
  month,
  today,
  initialEntries,
}: {
  month: string;
  today: string;
  initialEntries: MoodEntry[];
}) {
  const [entries, setEntries] = useState(() => new Map(initialEntries.map((e) => [e.day, e])));
  const [selected, setSelected] = useState<string | null>(today.startsWith(month) ? today : null);
  const [draftMood, setDraftMood] = useState<MoodKey | null>(() => (selected ? entries.get(selected)?.mood ?? null : null));
  const [draftNote, setDraftNote] = useState(() => (selected ? entries.get(selected)?.note ?? "" : ""));
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // T2 là cột đầu
  const cells: (string | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7) cells.push(null);

  const thisMonth = today.slice(0, 7);
  const monthEntries = useMemo(() => [...entries.values()].filter((e) => e.day.startsWith(month)), [entries, month]);

  const stats = useMemo(() => {
    const counts = new Map<MoodKey, number>();
    for (const e of monthEntries) counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
    return MOODS.map((mo, i) => ({ mood: mo, count: counts.get(mo.key) ?? 0, i })).sort(
      (a, b) => b.count - a.count || a.i - b.i,
    );
  }, [monthEntries]);

  // Nhẹ nhàng hỏi thăm khi 7 ngày gần đây có từ 3 ngày buồn, giận hoặc lo lắng.
  const heavyDays = useMemo(() => {
    const from = addDays(today, -6);
    return [...entries.values()].filter((e) => e.day >= from && e.day <= today && HEAVY_MOODS.includes(e.mood)).length;
  }, [entries, today]);

  function pick(day: string) {
    if (day > today) return;
    setSelected(day);
    const e = entries.get(day);
    setDraftMood(e?.mood ?? null);
    setDraftNote(e?.note ?? "");
    setStatus(null);
  }

  function save() {
    if (!selected || !draftMood) return;
    const day = selected;
    const mood = draftMood;
    const note = draftNote.trim().slice(0, NOTE_MAX);
    startTransition(async () => {
      const res = await saveMoodEntry(day, mood, note);
      if (!res.ok) return setStatus({ kind: "error", text: res.error });
      setEntries((prev) => new Map(prev).set(day, { day, mood, note }));
      setStatus({ kind: "ok", text: "Đã lưu vào nhật ký." });
    });
  }

  function remove() {
    if (!selected) return;
    const day = selected;
    startTransition(async () => {
      const res = await deleteMoodEntry(day);
      if (!res.ok) return setStatus({ kind: "error", text: res.error });
      setEntries((prev) => {
        const next = new Map(prev);
        next.delete(day);
        return next;
      });
      setDraftMood(null);
      setDraftNote("");
      setStatus({ kind: "ok", text: "Đã xóa ngày này khỏi nhật ký." });
    });
  }

  const saved = selected ? entries.get(selected) : undefined;
  const changed = !saved || saved.mood !== draftMood || saved.note !== draftNote.trim();

  return (
    <div className="diary-layout">
      <div className="diary-card diary-calendar">
        <div className="diary-cal-head">
          <Link className="diary-nav" href={`/nhat-ky?thang=${shiftMonth(month, -1)}`} aria-label="Tháng trước" scroll={false}>
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
          <h2>
            Tháng {m} {y}
          </h2>
          {month < thisMonth ? (
            <Link className="diary-nav" href={`/nhat-ky?thang=${shiftMonth(month, 1)}`} aria-label="Tháng sau" scroll={false}>
              <ChevronRight size={20} aria-hidden="true" />
            </Link>
          ) : (
            <span className="diary-nav is-disabled" aria-hidden="true">
              <ChevronRight size={20} />
            </span>
          )}
          {month !== thisMonth && (
            <Link className="btn btn-soft btn-sm diary-today" href="/nhat-ky" scroll={false}>
              Hôm nay
            </Link>
          )}
        </div>

        <div className="diary-grid" role="grid" aria-label={`Lịch tháng ${m} năm ${y}`}>
          {WEEKDAYS.map((w) => (
            <div key={w} className={`diary-wd ${w === "T7" ? "is-sat" : ""} ${w === "CN" ? "is-sun" : ""}`} role="columnheader">
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`x${i}`} className="diary-cell is-empty" aria-hidden="true" />;
            const e = entries.get(day);
            const future = day > today;
            const n = Number(day.slice(8));
            const col = i % 7;
            return (
              <button
                key={day}
                type="button"
                className={[
                  "diary-cell",
                  day === selected && "is-selected",
                  day === today && "is-today",
                  future && "is-future",
                  col === 6 && "is-sun",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={future}
                onClick={() => pick(day)}
                aria-pressed={day === selected}
                aria-label={`Ngày ${n}${e ? `: ${MOOD_BY_KEY[e.mood].label}` : future ? "" : ", chưa ghi"}`}
                style={e ? { background: MOOD_BY_KEY[e.mood].soft } : undefined}
              >
                <span className="diary-num">{n}</span>
                {e ? <MoodBlob mood={e.mood} size={46} /> : day === today && <span className="diary-plus">+</span>}
                {e?.note && <span className="diary-has-note" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <ul className="diary-legend">
          {MOODS.map((mo) => (
            <li key={mo.key}>
              <MoodBlob mood={mo.key} size={26} /> {mo.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="diary-side">
        <div className="diary-card diary-day">
          {!selected ? (
            <div className="diary-day-empty">
              <CalendarHeart size={32} aria-hidden="true" />
              <p>Nhật ký chỉ ghi được cho hôm nay. Em bấm vào ngày cũ để xem lại nhé.</p>
            </div>
          ) : selected !== today ? (
            <>
              <h2>{dayTitle(selected, today)}</h2>
              <div className="diary-big">
                {saved ? (
                  <MoodBlob mood={saved.mood} size={120} />
                ) : (
                  <div className="diary-big-empty" aria-hidden="true">
                    ?
                  </div>
                )}
                <span className="diary-big-label" style={saved ? { background: MOOD_BY_KEY[saved.mood].soft } : undefined}>
                  {saved ? MOOD_BY_KEY[saved.mood].label : "Ngày này em chưa ghi"}
                </span>
              </div>
              {saved?.note && <p className="diary-note-view">{saved.note}</p>}
              <p className="diary-lock">
                <Lock size={14} aria-hidden="true" /> Ngày này đã qua nên em chỉ xem lại được thôi.
              </p>
              {today.startsWith(month) && (
                <button type="button" className="btn btn-soft btn-sm" onClick={() => pick(today)}>
                  Ghi cho hôm nay
                </button>
              )}
            </>
          ) : (
            <>
              <h2>{dayTitle(selected, today)}</h2>
              <div className="diary-big">
                {draftMood ? (
                  <MoodBlob mood={draftMood} size={120} />
                ) : (
                  <div className="diary-big-empty" aria-hidden="true">
                    ?
                  </div>
                )}
                <span className="diary-big-label" style={draftMood ? { background: MOOD_BY_KEY[draftMood].soft } : undefined}>
                  {draftMood ? MOOD_BY_KEY[draftMood].label : "Hôm đó em thấy thế nào?"}
                </span>
              </div>

              <div className="diary-picker" role="radiogroup" aria-label="Chọn cảm xúc">
                {MOODS.map((mo) => (
                  <button
                    key={mo.key}
                    type="button"
                    role="radio"
                    aria-checked={draftMood === mo.key}
                    className={`diary-pick ${draftMood === mo.key ? "is-on" : ""}`}
                    style={draftMood === mo.key ? { background: mo.soft, borderColor: mo.shade } : undefined}
                    onClick={() => {
                      setDraftMood(mo.key);
                      setStatus(null);
                    }}
                  >
                    <MoodBlob mood={mo.key} size={38} />
                    <span>{mo.label}</span>
                  </button>
                ))}
              </div>

              <label className="diary-note-label" htmlFor="diary-note">
                Vài dòng cho hôm nay, không viết cũng được
              </label>
              <textarea
                id="diary-note"
                className="survey-text diary-note"
                rows={4}
                maxLength={NOTE_MAX}
                value={draftNote}
                placeholder="Hôm nay có chuyện gì khiến em thấy như vậy?"
                onChange={(ev) => {
                  setDraftNote(ev.target.value);
                  setStatus(null);
                }}
              />
              <div className="diary-note-count">
                {draftNote.length}/{NOTE_MAX}
              </div>

              <div className="diary-actions">
                <button type="button" className="btn btn-primary btn-sm" disabled={!draftMood || pending || !changed} onClick={save}>
                  {pending ? "Đang lưu…" : saved ? "Lưu thay đổi" : "Lưu vào nhật ký"}
                </button>
                {saved && (
                  <button type="button" className="link-button diary-delete" disabled={pending} onClick={remove}>
                    <Trash2 size={15} aria-hidden="true" /> Xóa ngày này
                  </button>
                )}
              </div>
              {status && (
                <p className={`diary-status is-${status.kind}`} role="status">
                  {status.text}
                </p>
              )}
            </>
          )}
        </div>

        {heavyDays >= 3 && (
          <div className="diary-card diary-care">
            <p>
              Mấy ngày gần đây em có vẻ không được vui. Em không phải tự mình chịu đựng đâu. Kể với {siteConfig.botName}
              hoặc hẹn gặp chuyên viên tham vấn nhé.
            </p>
            <div className="diary-actions">
              <OpenChatButton className="btn btn-primary btn-sm" message="Mấy ngày gần đây mình thấy không được vui.">
                <MessageCircleHeart size={16} aria-hidden="true" /> Trò chuyện ngay
              </OpenChatButton>
              <Link className="btn btn-outline btn-sm" href={siteConfig.counselingPath}>
                Tham vấn
              </Link>
            </div>
          </div>
        )}

        <div className="diary-card diary-stats">
          <h2>
            <BarChart3 size={18} aria-hidden="true" /> Thống kê tháng {m}
          </h2>
          {monthEntries.length === 0 ? (
            <p className="survey-muted small">Tháng này em chưa ghi ngày nào.</p>
          ) : (
            <>
              <p className="survey-muted small">
                Em đã ghi {monthEntries.length} ngày trong tháng.
              </p>
              <ul className="diary-bars">
                {stats.map(({ mood: mo, count }) => {
                  const pct = Math.round((count / monthEntries.length) * 100);
                  return (
                    <li key={mo.key} className={count ? "" : "is-zero"}>
                      <MoodBlob mood={mo.key} size={26} title={mo.label} />
                      <span className="diary-bar-name">{mo.label}</span>
                      <span className="diary-bar">
                        <span style={{ width: `${pct}%`, background: mo.shade }} />
                      </span>
                      <span className="diary-bar-pct">{pct}%</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
