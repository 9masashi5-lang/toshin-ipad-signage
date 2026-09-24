"use client";

import { useEffect, useState } from "react";
import { calculateRemainingDays } from "@/lib/countdown";
import type { CountdownContent } from "@/types/signage";

export function CountdownDisplay({ countdown }: { countdown: CountdownContent }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const days = calculateRemainingDays(countdown.targetDate, now);
  const dayLabel = days === null ? "—" : Math.max(days, 0).toLocaleString("ja-JP");

  return (
    <section className="signage-stage countdown-stage" aria-label="カウントダウン">
      <div className="countdown-grid" />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-8 py-10 text-center">
        <p className="text-[clamp(1.8rem,4vw,4rem)] font-black tracking-wide text-blue-100">
          {countdown.title || "目標日まで"}
        </p>
        <p className="mt-[clamp(1rem,3vh,2rem)] text-[clamp(1.3rem,2.5vw,2.2rem)] font-bold text-cyan-200">あと</p>
        <div className="my-[clamp(0.5rem,2vh,1.5rem)] flex items-end justify-center gap-[clamp(0.75rem,2vw,1.5rem)]">
          <span className="text-[clamp(7rem,24vw,20rem)] font-black leading-[0.82] tracking-[-0.08em] text-white tabular-nums drop-shadow-2xl">
            {dayLabel}
          </span>
          <span className="pb-[clamp(0.8rem,3vw,2.5rem)] text-[clamp(2.5rem,6vw,5rem)] font-black text-cyan-200">日</span>
        </div>
        {days !== null && days < 0 && (
          <p className="mb-4 rounded-full bg-white/15 px-5 py-2 text-xl font-bold text-white">目標日を過ぎています</p>
        )}
        <p className="max-w-4xl text-[clamp(1.4rem,3.2vw,3rem)] font-bold leading-relaxed text-white/90">
          {countdown.message}
        </p>
      </div>
    </section>
  );
}
