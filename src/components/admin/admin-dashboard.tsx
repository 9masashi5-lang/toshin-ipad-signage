"use client";

import { useMemo, useState } from "react";
import { SignageCanvas } from "@/components/display/signage-canvas";
import { useSignage } from "@/hooks/use-signage";
import { updateSignage } from "@/lib/signage-store";
import {
  rankingBackgroundThemes,
  type CountdownContent,
  type NoticeContent,
  type RankingContent,
  type SignageMode,
} from "@/types/signage";

const modeLabels: Record<SignageMode, string> = {
  ranking: "ランキング",
  notice: "重要なお知らせ",
  countdown: "カウントダウン",
};
type Feedback = { kind: "success" | "error"; message: string } | null;

export function AdminDashboard() {
  const signageData = useSignage();

  if (signageData.connection === "loading") {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-100 px-5 text-center text-lg font-black text-slate-700">
        管理画面を読み込み中…
      </main>
    );
  }

  return <AdminDashboardContent {...signageData} />;
}

function AdminDashboardContent({
  signage,
  connection,
  connectionMessage,
}: ReturnType<typeof useSignage>) {
  const [rankingSlides, setRankingSlides] = useState<RankingContent[]>(signage.rankingSlides);
  const [notice, setNotice] = useState<NoticeContent>(signage.notice);
  const [countdown, setCountdown] = useState<CountdownContent>(signage.countdown);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busyAction, setBusyAction] = useState("");

  const previewState = useMemo(
    () => ({
      ...signage,
      ranking: rankingSlides[0] ?? signage.ranking,
      rankingSlides,
      notice,
      countdown,
    }),
    [signage, rankingSlides, notice, countdown],
  );

  const rankingPatch = {
    ranking: rankingSlides[0] ?? signage.ranking,
    rankingSlides,
  };

  function updateRankingSlide(index: number, update: (slide: RankingContent) => RankingContent) {
    setRankingSlides((slides) =>
      slides.map((slide, slideIndex) => (slideIndex === index ? update(slide) : slide)),
    );
  }

  function addRankingSlide() {
    setRankingSlides((slides) => {
      if (slides.length >= 10) return slides;
      const slideNumber = slides.length + 1;
      const uniqueId = Date.now();
      return [
        ...slides,
        {
          title: `ランキング ${slideNumber}`,
          backgroundTheme: "navy",
          entries: [1, 2, 3].map((rank) => ({
            id: `slide-${uniqueId}-rank-${rank}`,
            name: "",
            score: 0,
          })),
        },
      ];
    });
  }

  function removeRankingSlide(index: number) {
    setRankingSlides((slides) => slides.filter((_, slideIndex) => slideIndex !== index));
  }

  function moveRankingSlide(index: number, direction: -1 | 1) {
    setRankingSlides((slides) => {
      const destination = index + direction;
      if (destination < 0 || destination >= slides.length) return slides;
      const next = [...slides];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  async function runAction(label: string, action: () => Promise<void>) {
    setBusyAction(label);
    setFeedback(null);
    try {
      await action();
      setFeedback({ kind: "success", message: `${label}しました。iPadへ反映されます。` });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "操作に失敗しました。通信環境を確認してください。",
      });
    } finally {
      setBusyAction("");
    }
  }

  return (
    <main className="min-h-dvh bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-6 sm:px-8">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-cyan-300">TOSHIN SIGNAGE</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">サイネージ管理</h1>
          </div>
          <button
            className="return-button"
            disabled={Boolean(busyAction)}
            onClick={() => runAction("通常表示に変更", () => updateSignage({ mode: "ranking", ...rankingPatch }))}
          >
            通常表示（ランキング）に戻す
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <section className="admin-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="section-kicker">現在の表示</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
                  <h2 className="text-2xl font-black">{modeLabels[signage.mode]}</h2>
                </div>
              </div>
              <span className={`status-pill status-${connection}`}>
                {connection === "live" ? "リアルタイム接続中" : connection === "loading" ? "接続中" : connection === "cached" ? "一時的にオフライン" : "接続エラー"}
              </span>
            </div>
            {connectionMessage && <p className="mt-3 text-sm font-semibold text-slate-600">{connectionMessage}</p>}
          </section>

          {feedback && (
            <div className={`border px-5 py-4 font-bold ${feedback.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role="status">
              {feedback.message}
            </div>
          )}

          <section className="admin-card">
            <SectionHeading number="01" title="ランキングスライド" description="通常表示では10秒ごとに自動切替" />
            <div className="mt-6 space-y-5">
              {rankingSlides.map((ranking, slideIndex) => (
                <div key={slideIndex} className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-black text-slate-900">スライド {slideIndex + 1}</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="secondary-button min-h-0 px-3 py-2 text-sm"
                        disabled={slideIndex === 0 || Boolean(busyAction)}
                        onClick={() => moveRankingSlide(slideIndex, -1)}
                      >
                        上へ
                      </button>
                      <button
                        className="secondary-button min-h-0 px-3 py-2 text-sm"
                        disabled={slideIndex === rankingSlides.length - 1 || Boolean(busyAction)}
                        onClick={() => moveRankingSlide(slideIndex, 1)}
                      >
                        下へ
                      </button>
                      <button
                        className="danger-button"
                        disabled={rankingSlides.length === 1 || Boolean(busyAction)}
                        onClick={() => removeRankingSlide(slideIndex)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  <label className="form-label mt-4">
                    見出し
                    <input
                      className="form-input"
                      value={ranking.title}
                      onChange={(event) => updateRankingSlide(slideIndex, (slide) => ({ ...slide, title: event.target.value }))}
                    />
                  </label>
                  <label className="form-label mt-4">
                    背景デザイン
                    <select
                      className="form-input"
                      value={ranking.backgroundTheme}
                      onChange={(event) =>
                        updateRankingSlide(slideIndex, (slide) => ({
                          ...slide,
                          backgroundTheme: event.target.value as RankingContent["backgroundTheme"],
                        }))
                      }
                    >
                      {rankingBackgroundThemes.map((theme) => (
                        <option key={theme.value} value={theme.value}>
                          {theme.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-5 space-y-3">
                    {ranking.entries.map((entry, entryIndex) => (
                      <div key={entry.id} className="grid grid-cols-[3rem_minmax(0,1fr)_7rem] items-center gap-3 sm:grid-cols-[3rem_minmax(0,1fr)_9rem]">
                        <span className="text-center text-lg font-black text-blue-700">{entryIndex + 1}位</span>
                        <input
                          aria-label={`スライド${slideIndex + 1} ${entryIndex + 1}位の名前`}
                          className="form-input mt-0"
                          value={entry.name}
                          onChange={(event) => updateRankingSlide(slideIndex, (slide) => ({ ...slide, entries: slide.entries.map((item, itemIndex) => itemIndex === entryIndex ? { ...item, name: event.target.value } : item) }))}
                        />
                        <input
                          aria-label={`スライド${slideIndex + 1} ${entryIndex + 1}位の点数`}
                          className="form-input mt-0"
                          type="number"
                          min="0"
                          value={entry.score}
                          onChange={(event) => updateRankingSlide(slideIndex, (slide) => ({ ...slide, entries: slide.entries.map((item, itemIndex) => itemIndex === entryIndex ? { ...item, score: Number(event.target.value) } : item) }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="secondary-button mt-5" disabled={rankingSlides.length >= 10 || Boolean(busyAction)} onClick={addRankingSlide}>
              ＋ ランキングスライドを追加
            </button>
            <p className="mt-2 text-sm font-semibold text-slate-500">最大10枚まで。上から順に10秒ずつ表示します。</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="secondary-button" disabled={Boolean(busyAction)} onClick={() => runAction("ランキングを保存", () => updateSignage(rankingPatch))}>ランキングスライドを保存</button>
              <button className="primary-button" disabled={Boolean(busyAction)} onClick={() => runAction("ランキングを表示", () => updateSignage({ mode: "ranking", ...rankingPatch }))}>今すぐランキングを表示</button>
            </div>
          </section>

          <section className="admin-card">
            <SectionHeading number="02" title="重要なお知らせ" description="ランキングを隠して全画面表示" />
            <div className="mt-6 grid gap-5">
              <label className="form-label">
                タイトル
                <input className="form-input" value={notice.title} onChange={(event) => setNotice((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="form-label">
                本文
                <textarea className="form-input min-h-32 resize-y" value={notice.message} onChange={(event) => setNotice((current) => ({ ...current, message: event.target.value }))} />
              </label>
            </div>
            <button className="primary-button mt-6" disabled={Boolean(busyAction)} onClick={() => runAction("重要なお知らせを表示", () => updateSignage({ mode: "notice", notice }))}>
              重要なお知らせを今すぐ表示
            </button>
          </section>

          <section className="admin-card">
            <SectionHeading number="03" title="カウントダウン" description="目標日から残り日数を自動計算" />
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="form-label sm:col-span-2">
                タイトル
                <input className="form-input" value={countdown.title} onChange={(event) => setCountdown((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="form-label">
                目標日
                <input className="form-input" type="date" value={countdown.targetDate} onChange={(event) => setCountdown((current) => ({ ...current, targetDate: event.target.value }))} />
              </label>
              <label className="form-label">
                補足メッセージ
                <input className="form-input" value={countdown.message} onChange={(event) => setCountdown((current) => ({ ...current, message: event.target.value }))} />
              </label>
            </div>
            <button className="primary-button mt-6" disabled={Boolean(busyAction) || !countdown.targetDate} onClick={() => runAction("カウントダウンを表示", () => updateSignage({ mode: "countdown", countdown }))}>
              カウントダウンを今すぐ表示
            </button>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="admin-card">
            <p className="section-kicker">現在の表示プレビュー</p>
            <p className="mt-1 text-sm text-slate-500">入力中の内容も確認できます</p>
            <div className="preview-frame mt-4 aspect-[4/3] overflow-hidden bg-slate-950 shadow-inner">
              <div className="preview-scale"><SignageCanvas signage={previewState} /></div>
            </div>
            <a href="/display" target="_blank" rel="noreferrer" className="secondary-button mt-4 block text-center">/display を別タブで開く</a>
          </div>
        </aside>
      </div>
    </main>
  );
}

function SectionHeading({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="section-heading">
      <div><p className="section-number">{number}</p><h2>{title}</h2></div>
      <p>{description}</p>
    </div>
  );
}
