"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

interface SeatHoldTimerProps {
  expiresAt: string | null;
  onExpire?: () => void;
  className?: string;
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SeatHoldTimer({ expiresAt, onExpire, className = "" }: SeatHoldTimerProps) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) { setRemainingMs(null); setExpired(false); return; }
    const exp = new Date(expiresAt).getTime();
    if (!Number.isFinite(exp)) { setRemainingMs(null); return; }
    const tick = () => {
      const left = exp - Date.now();
      if (left <= 0) {
        setRemainingMs(0);
        if (!expired) { setExpired(true); onExpire?.(); }
      } else {
        setRemainingMs(left);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, onExpire, expired]);

  if (!expiresAt || remainingMs === null) return null;
  const urgent = remainingMs <= 60_000;

  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${urgent ? "border-rose-400/30 bg-rose-500/10 text-rose-200" : "border-accent/30 bg-accent/10 text-accent"} ${className}`}>
      <Timer className="h-4 w-4" />
      <span>Seats held for {formatRemaining(remainingMs)}</span>
    </div>
  );
}
