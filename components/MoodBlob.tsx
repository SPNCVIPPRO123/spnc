import type { ReactNode } from "react";
import { MOOD_BY_KEY, type MoodKey } from "@/lib/moods";

// Nhân vật "bánh mochi" tự vẽ bằng SVG cho từng cảm xúc.
const INK = "#3b3350";

const eyes = {
  smile: (
    <>
      <path d="M32 47 q5 -7 10 0" />
      <path d="M58 47 q5 -7 10 0" />
    </>
  ),
  calm: (
    <>
      <path d="M32 45 q5 5 10 0" />
      <path d="M58 45 q5 5 10 0" />
    </>
  ),
  open: (
    <>
      <circle cx="37" cy="46" r="4.6" fill={INK} stroke="none" />
      <circle cx="63" cy="46" r="4.6" fill={INK} stroke="none" />
      <circle cx="38.6" cy="44.3" r="1.6" fill="#fff" stroke="none" />
      <circle cx="64.6" cy="44.3" r="1.6" fill="#fff" stroke="none" />
    </>
  ),
  dot: (
    <>
      <circle cx="37" cy="47" r="3.2" fill={INK} stroke="none" />
      <circle cx="63" cy="47" r="3.2" fill={INK} stroke="none" />
    </>
  ),
  sleepy: (
    <>
      <path d="M31 46 q6 4 12 0" />
      <path d="M57 46 q6 4 12 0" />
      <path d="M32 42 h10" opacity="0.5" />
      <path d="M58 42 h10" opacity="0.5" />
    </>
  ),
};

const mouths = {
  open: <path d="M43 55 q7 11 14 0 z" fill={INK} />,
  smile: <path d="M44 56 q6 6 12 0" />,
  flat: <path d="M45 58 h10" />,
  frown: <path d="M44 61 q6 -6 12 0" />,
  wavy: <path d="M42 59 q4 -4 8 0 q4 4 8 0" />,
  tiny: <path d="M47 58 q3 2.5 6 0" />,
};

type Face = { eyes: keyof typeof eyes; mouth: keyof typeof mouths; brows?: ReactNode; extra?: ReactNode; blush?: boolean };

const FACES: Record<MoodKey, Face> = {
  "hao-huc": {
    eyes: "smile",
    mouth: "open",
    blush: true,
    extra: (
      <path
        d="M78 14 c-3 -5 -10 -3 -9 2 c0.6 3.5 5 6 9 9 c4 -3 8.4 -5.5 9 -9 c1 -5 -6 -7 -9 -2 z"
        fill="#ff6f9c"
        stroke="none"
      />
    ),
  },
  "vui-ve": { eyes: "open", mouth: "open", blush: true },
  "binh-yen": { eyes: "calm", mouth: "smile", blush: true },
  "binh-thuong": { eyes: "dot", mouth: "flat" },
  "met-moi": {
    eyes: "sleepy",
    mouth: "wavy",
    extra: (
      <text x="74" y="22" fontSize="13" fontWeight="700" fill="#6c6f91" stroke="none" fontFamily="inherit">
        z
      </text>
    ),
  },
  buon: {
    eyes: "open",
    mouth: "frown",
    brows: (
      <>
        <path d="M31 38 l10 -4" />
        <path d="M69 38 l-10 -4" />
      </>
    ),
    extra: <path d="M30 53 q-3 5 0 7.5 q3 -2.5 0 -7.5 z" fill="#5fa7ea" stroke="none" />,
  },
  "gian-du": {
    eyes: "dot",
    mouth: "frown",
    brows: (
      <>
        <path d="M30 37 l12 5" />
        <path d="M70 37 l-12 5" />
      </>
    ),
    extra: (
      <g stroke="#d43d2a" strokeWidth="2.6">
        <path d="M73 12 q3 4 0 8" />
        <path d="M83 12 q-3 4 0 8" />
        <path d="M74 25 q4 -3 8 0" />
      </g>
    ),
  },
  "lo-lang": {
    eyes: "dot",
    mouth: "wavy",
    brows: (
      <>
        <path d="M31 39 l10 -3" />
        <path d="M69 39 l-10 -3" />
      </>
    ),
    extra: <path d="M80 26 q-4 6 0 9 q4 -3 0 -9 z" fill="#7cc6ff" stroke="none" />,
  },
};

export default function MoodBlob({ mood, size = 56, title }: { mood: MoodKey; size?: number; title?: string }) {
  const m = MOOD_BY_KEY[mood];
  const face = FACES[mood];
  const id = `mb-${mood}`;
  return (
    <svg
      viewBox="0 0 100 84"
      width={size}
      height={(size * 84) / 100}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className="mood-blob"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={m.body} />
          <stop offset="1" stopColor={m.shade} />
        </linearGradient>
      </defs>
      <ellipse cx="50" cy="78" rx="34" ry="4.5" fill="#3b3350" opacity="0.08" />
      <path
        d="M10 68 C10 34 28 16 50 16 C72 16 90 34 90 68 Q90 76 82 76 L18 76 Q10 76 10 68 Z"
        fill={`url(#${id})`}
      />
      <ellipse cx="34" cy="28" rx="10" ry="5" fill="#fff" opacity="0.45" transform="rotate(-20 34 28)" />
      {face.blush && (
        <>
          <ellipse cx="27" cy="56" rx="6" ry="3.6" fill="#ff7fa3" opacity="0.38" />
          <ellipse cx="73" cy="56" rx="6" ry="3.6" fill="#ff7fa3" opacity="0.38" />
        </>
      )}
      <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {face.brows}
        {eyes[face.eyes]}
        {mouths[face.mouth]}
        {face.extra}
      </g>
    </svg>
  );
}
