"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Đếm ngược đến giờ mở phòng, đến giờ thì tự tải lại trang.
export default function CallCountdown({ opensAt }: { opensAt: number }) {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const ms = opensAt - Date.now();
      setLeft(ms);
      if (ms <= 0) router.refresh();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [opensAt, router]);
  if (left === null) return null;
  if (left <= 0) return <p className="survey-muted">Đang mở phòng…</p>;
  const total = Math.ceil(left / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const text = h > 24 ? `${Math.floor(h / 24)} ngày nữa` : `${h ? `${h} giờ ` : ""}${m} phút ${s} giây nữa`;
  return (
    <p className="survey-muted" role="timer">
      Còn {text}. Em cứ để trang này mở, đến giờ trang sẽ tự vào phòng.
    </p>
  );
}
