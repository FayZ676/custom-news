// hooks/useTickerScroll.ts
import { useRef, useEffect, useCallback } from "react";

const TICKER_SPEED = 0.01; // px per ms
const RESUME_DELAY_MS = 1500;

export function useTickerScroll() {
  const tickerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const scrollPosRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;

    let animId: number;
    let lastTime: number | undefined;

    const step = (time: number) => {
      if (lastTime !== undefined && !isPausedRef.current) {
        const half = el.scrollWidth / 2;
        if (half > 0) {
          scrollPosRef.current += (time - lastTime) * TICKER_SPEED;
          if (scrollPosRef.current >= half) scrollPosRef.current -= half;
          el.scrollLeft = scrollPosRef.current;
        }
      }
      lastTime = time;
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  const pause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, RESUME_DELAY_MS);
  }, []);

  const resume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    isPausedRef.current = false;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const el = tickerRef.current;
      if (!el) return;

      pause();
      scheduleResume();

      const half = el.scrollWidth / 2;
      if (half > 0) {
        const delta = e.deltaX || e.deltaY;
        const newPos = scrollPosRef.current + delta;
        scrollPosRef.current = ((newPos % half) + half) % half;
        el.scrollLeft = scrollPosRef.current;
      }
    },
    [pause, scheduleResume],
  );

  return { tickerRef, pause, resume, handleWheel };
}
