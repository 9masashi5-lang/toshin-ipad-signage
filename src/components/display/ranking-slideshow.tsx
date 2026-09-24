"use client";

import { useEffect, useState } from "react";
import { RankingDisplay } from "@/components/display/ranking-display";
import type { RankingContent } from "@/types/signage";

export const RANKING_SLIDE_INTERVAL_MS = 10_000;

export function RankingSlideshow({ slides }: { slides: RankingContent[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeIndex = slides.length > 0 ? currentIndex % slides.length : 0;
  const activeSlide = slides[activeIndex];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(
      () => setCurrentIndex((index) => (index + 1) % slides.length),
      RANKING_SLIDE_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!activeSlide) return null;

  return (
    <div className="ranking-slideshow">
      <div key={activeIndex} className="ranking-slide-enter h-full w-full">
        <RankingDisplay ranking={activeSlide} />
      </div>
      {slides.length > 1 && (
        <div className="ranking-slide-indicator" aria-label={`${slides.length}枚中${activeIndex + 1}枚目`}>
          {slides.map((_, index) => (
            <span
              key={index}
              className={index === activeIndex ? "ranking-slide-dot ranking-slide-dot-active" : "ranking-slide-dot"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
