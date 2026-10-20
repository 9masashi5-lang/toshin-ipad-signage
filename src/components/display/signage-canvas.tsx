import { CountdownDisplay } from "@/components/display/countdown-display";
import { NoticeDisplay } from "@/components/display/notice-display";
import { RankingSlideshow } from "@/components/display/ranking-slideshow";
import type { SignageState } from "@/types/signage";

export function SignageCanvas({ signage }: { signage: SignageState }) {
  return (
    <div key={signage.mode} className="mode-transition h-full w-full">
      {signage.mode === "notice" ? (
        <NoticeDisplay notice={signage.notice} />
      ) : signage.mode === "countdown" ? (
        <CountdownDisplay countdown={signage.countdown} />
      ) : (
        <RankingSlideshow slides={signage.rankingSlides} />
      )}
    </div>
  );
}
