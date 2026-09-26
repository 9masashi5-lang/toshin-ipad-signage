import type { NoticeContent } from "@/types/signage";

const messageSizeClasses: Record<NoticeContent["messageSize"], string> = {
  small: "text-[clamp(1.1rem,2.2vw,2rem)]",
  medium: "text-[clamp(1.3rem,3vw,2.7rem)]",
  large: "text-[clamp(1.7rem,4vw,3.6rem)]",
  xlarge: "text-[clamp(2.1rem,5vw,4.5rem)]",
};

export function NoticeDisplay({ notice }: { notice: NoticeContent }) {
  return (
    <section className="signage-stage notice-stage" aria-label="重要なお知らせ">
      <div className="notice-accent" />
      <div className="notice-layout">
        <div className="min-w-0">
          <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-red-600 px-5 py-2 text-[clamp(0.9rem,1.7vw,1.3rem)] font-black tracking-[0.16em] text-white">
            IMPORTANT
          </div>
          <h1 className="text-balance text-[clamp(2.4rem,6vw,5.6rem)] font-black leading-[1.08] tracking-tight text-slate-950">
            {notice.title || "重要なお知らせ"}
          </h1>
          {notice.message && (
            <p className={`mt-[clamp(1.2rem,4vh,3rem)] whitespace-pre-wrap font-bold leading-[1.5] text-slate-700 ${messageSizeClasses[notice.messageSize]}`}>
              {notice.message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
