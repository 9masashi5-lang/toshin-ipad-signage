export type SignageMode = "ranking" | "notice" | "countdown";

export type RankingEntry = { id: string; name: string; score: number };
export type RankingContent = { title: string; entries: RankingEntry[] };
export type NoticeContent = {
  title: string;
  message: string;
};
export type CountdownContent = {
  title: string;
  targetDate: string;
  message: string;
};

export type SignageState = {
  mode: SignageMode;
  ranking: RankingContent;
  rankingSlides: RankingContent[];
  notice: NoticeContent;
  countdown: CountdownContent;
  updatedAt?: unknown;
};

const defaultRanking: RankingContent = {
  title: "今週のランキング",
  entries: [
    { id: "rank-1", name: "山田さん", score: 1800 },
    { id: "rank-2", name: "田中さん", score: 1600 },
    { id: "rank-3", name: "佐藤さん", score: 1540 },
  ],
};

export const defaultSignageState: SignageState = {
  mode: "ranking",
  ranking: defaultRanking,
  rankingSlides: [defaultRanking],
  notice: {
    title: "重要なお知らせ",
    message: "本日の予定を確認してください。",
  },
  countdown: {
    title: "共通テストまで",
    targetDate: "",
    message: "今日も一歩ずつ。",
  },
};

const modes: SignageMode[] = ["ranking", "notice", "countdown"];

export function normalizeSignageState(value: unknown): SignageState {
  if (!value || typeof value !== "object") return defaultSignageState;
  const data = value as Partial<SignageState>;
  const legacyRanking = normalizeRanking(data.ranking, defaultSignageState.ranking);
  const rankingSlides = Array.isArray(data.rankingSlides) && data.rankingSlides.length > 0
    ? data.rankingSlides
        .slice(0, 10)
        .map((ranking) => normalizeRanking(ranking, defaultSignageState.ranking))
    : [legacyRanking];
  const notice = data.notice;
  const countdown = data.countdown;

  return {
    mode: modes.includes(data.mode as SignageMode)
      ? (data.mode as SignageMode)
      : defaultSignageState.mode,
    ranking: rankingSlides[0],
    rankingSlides,
    notice: {
      title: typeof notice?.title === "string" ? notice.title : defaultSignageState.notice.title,
      message:
        typeof notice?.message === "string" ? notice.message : defaultSignageState.notice.message,
    },
    countdown: {
      title:
        typeof countdown?.title === "string"
          ? countdown.title
          : defaultSignageState.countdown.title,
      targetDate: typeof countdown?.targetDate === "string" ? countdown.targetDate : "",
      message:
        typeof countdown?.message === "string"
          ? countdown.message
          : defaultSignageState.countdown.message,
    },
    updatedAt: data.updatedAt,
  };
}

function normalizeRanking(value: unknown, fallback: RankingContent): RankingContent {
  if (!value || typeof value !== "object") return fallback;
  const ranking = value as Partial<RankingContent>;
  return {
    title: typeof ranking.title === "string" ? ranking.title : fallback.title,
    entries: Array.isArray(ranking.entries)
      ? ranking.entries
          .filter((entry) => entry && typeof entry === "object")
          .slice(0, 10)
          .map((entry, index) => {
            const item = entry as Partial<RankingEntry>;
            return {
              id: typeof item.id === "string" ? item.id : `rank-${index + 1}`,
              name: typeof item.name === "string" ? item.name : "",
              score:
                typeof item.score === "number" && Number.isFinite(item.score)
                  ? item.score
                  : 0,
            };
          })
      : fallback.entries,
  };
}
