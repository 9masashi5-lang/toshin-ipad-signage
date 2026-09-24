import type { RankingContent } from "@/types/signage";

export function RankingDisplay({ ranking }: { ranking: RankingContent }) {
  return (
    <section className="signage-stage ranking-stage" aria-label="ランキング">
      <div className="ranking-orb ranking-orb-one" />
      <div className="ranking-orb ranking-orb-two" />
      <div className="relative z-10 flex h-full w-full flex-col justify-center px-[clamp(2rem,6vw,6rem)] py-[clamp(1.5rem,5vh,4rem)]">
        <p className="mb-3 text-[clamp(1rem,2vw,1.5rem)] font-bold tracking-[0.24em] text-cyan-200">
          WEEKLY ACHIEVEMENT
        </p>
        <h1 className="mb-[clamp(1.5rem,4vh,3rem)] text-[clamp(2.5rem,6vw,5.5rem)] font-black tracking-tight text-white">
          {ranking.title}
        </h1>
        <ol className="grid gap-[clamp(0.7rem,1.8vh,1.3rem)]">
          {ranking.entries.slice(0, 5).map((entry, index) => (
            <li
              key={entry.id}
              className={`ranking-row ${index === 0 ? "ranking-row-first" : ""}`}
            >
              <span className="rank-number">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[clamp(1.35rem,3.2vw,3rem)] font-extrabold text-white">
                {entry.name || "—"}
              </span>
              <span className="text-[clamp(1.35rem,3.2vw,3rem)] font-black tabular-nums text-cyan-100">
                {entry.score.toLocaleString("ja-JP")}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
