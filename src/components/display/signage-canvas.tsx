import { CountdownDisplay } from "@/components/display/countdown-display";
import { NoticeDisplay } from "@/components/display/notice-display";
import { RankingDisplay } from "@/components/display/ranking-display";
import type { SignageState } from "@/types/signage";

export function SignageCanvas({ signage }: { signage: SignageState }) {
  if (signage.mode === "notice") return <NoticeDisplay notice={signage.notice} />;
  if (signage.mode === "countdown") return <CountdownDisplay countdown={signage.countdown} />;
  return <RankingDisplay ranking={signage.ranking} />;
}
