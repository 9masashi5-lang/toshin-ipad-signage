"use client";

import { useEffect, useState } from "react";
import { calculateRemainingDays, getTokyoTimePeriod, type TokyoTimePeriod } from "@/lib/countdown";
import type { CountdownContent } from "@/types/signage";

const timePeriodSettings: Record<TokyoTimePeriod, { className: string; label: string }> = {
  morning: { className: "countdown-theme-morning", label: "MORNING FOCUS" },
  day: { className: "countdown-theme-day", label: "DAYTIME CHALLENGE" },
  evening: { className: "countdown-theme-evening", label: "EVENING BOOST" },
  night: { className: "countdown-theme-night", label: "NIGHT MISSION" },
};

type HiddenEvent = {
  kind: "milestone" | "rare";
  eyebrow: string;
  title: string;
  message: string;
};

const milestoneEvents: Partial<Record<number, Omit<HiddenEvent, "kind">>> = {
  100: { eyebrow: "THE NEXT 100 DAYS", title: "あと100日", message: "ここから、すべてが伸びる。" },
  50: { eyebrow: "HALFWAY BOOST", title: "あと50日", message: "本気が、結果に変わる時間。" },
  30: { eyebrow: "LAST 30 DAYS", title: "あと30日", message: "一日ごとの積み重ねが、大きな差になる。" },
  10: { eyebrow: "FINAL COUNTDOWN", title: "あと10日", message: "積み上げた力を、答案へ。" },
  7: { eyebrow: "ONE WEEK TO GO", title: "あと1週間", message: "最後まで、伸び続ける。" },
  1: { eyebrow: "TOMORROW", title: "いよいよ明日", message: "いつも通り、全力で。" },
};

const rareEvent: HiddenEvent = {
  kind: "rare",
  eyebrow: "ONE MINUTE, ONE FUTURE",
  title: "その1分が、合否を変える",
  message: "今できる一問に、集中しよう。",
};

export function CountdownDisplay({ countdown }: { countdown: CountdownContent }) {
  const [now, setNow] = useState(() => new Date());
  const [hiddenEvent, setHiddenEvent] = useState<HiddenEvent | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const days = calculateRemainingDays(countdown.targetDate, now);
  const dayLabel = days === null ? "—" : Math.max(days, 0).toLocaleString("ja-JP");
  const timePeriod = getTokyoTimePeriod(now);
  const theme = timePeriodSettings[timePeriod];

  useEffect(() => {
    if (!countdown.hiddenEventsEnabled) return;

    let milestoneTimer: number | undefined;
    let rareTimer: number | undefined;
    let hideTimer: number | undefined;

    const showEvent = (event: HiddenEvent, duration: number) => {
      window.clearTimeout(hideTimer);
      setHiddenEvent(event);
      hideTimer = window.setTimeout(() => setHiddenEvent(null), duration);
    };

    const milestone = days === null ? undefined : milestoneEvents[days];
    if (milestone) {
      milestoneTimer = window.setTimeout(
        () => showEvent({ kind: "milestone", ...milestone }, 8_000),
        1_800,
      );
    }

    const scheduleRareEvent = (firstRun: boolean) => {
      const minimumDelay = firstRun ? 120_000 : 240_000;
      const randomWindow = firstRun ? 120_000 : 240_000;
      rareTimer = window.setTimeout(() => {
        showEvent(rareEvent, 6_500);
        scheduleRareEvent(false);
      }, minimumDelay + Math.random() * randomWindow);
    };
    scheduleRareEvent(true);

    return () => {
      window.clearTimeout(milestoneTimer);
      window.clearTimeout(rareTimer);
      window.clearTimeout(hideTimer);
    };
  }, [countdown.hiddenEventsEnabled, days]);

  const visibleHiddenEvent = countdown.hiddenEventsEnabled ? hiddenEvent : null;

  return (
    <section className={`signage-stage countdown-stage ${theme.className}`} aria-label="カウントダウン">
      <div className="countdown-atmosphere" aria-hidden="true" />
      <div className="countdown-stars" aria-hidden="true" />
      <div className="countdown-sun" aria-hidden="true" />
      <div className="countdown-horizon" aria-hidden="true" />
      <div className="countdown-grid" aria-hidden="true" />
      <div className="countdown-ring countdown-ring-one" aria-hidden="true" />
      <div className="countdown-ring countdown-ring-two" aria-hidden="true" />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-8 py-10 text-center">
        <p className="text-[clamp(1.8rem,4vw,4rem)] font-black tracking-wide text-blue-100">
          {countdown.title || "目標日まで"}
        </p>
        <p className="mt-[clamp(1rem,3vh,2rem)] text-[clamp(1.3rem,2.5vw,2.2rem)] font-bold text-cyan-200">あと</p>
        <div className="my-[clamp(0.5rem,2vh,1.5rem)] flex items-end justify-center gap-[clamp(0.75rem,2vw,1.5rem)]">
          <span className="countdown-number text-[clamp(7rem,24vw,20rem)] font-black leading-[0.82] tracking-[-0.08em] text-white tabular-nums drop-shadow-2xl">
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
      <p className="countdown-time-label" aria-label={`現在の時間帯テーマ: ${theme.label}`}>
        <span aria-hidden="true" />
        {theme.label}
      </p>
      {visibleHiddenEvent ? (
        <div
          className={`countdown-event-overlay countdown-event-${visibleHiddenEvent.kind}`}
          role="status"
          aria-live="polite"
        >
          <div className="countdown-event-rays" aria-hidden="true" />
          <div className="countdown-event-scan" aria-hidden="true" />
          <div className="countdown-event-content">
            <p className="countdown-event-eyebrow">{visibleHiddenEvent.eyebrow}</p>
            <p className="countdown-event-title">{visibleHiddenEvent.title}</p>
            <p className="countdown-event-message">{visibleHiddenEvent.message}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
