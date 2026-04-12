import { useRef, useEffect, useCallback } from "react";

const TICKER_SPEED = 0.01; // px/ms
const RESUME_DELAY_MS = 1500;

export function useTickerScroll() {
  const tickerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const scrollPosRef = useRef(0);
  const halfWidthRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchLastXRef = useRef<number | null>(null);

  useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;

    // Cache half-width once so we don't read scrollWidth every frame
    const observer = new ResizeObserver(() => {
      halfWidthRef.current = el.scrollWidth / 2;
    });
    observer.observe(el);
    halfWidthRef.current = el.scrollWidth / 2;

    // rAF marquee loop
    let animId: number;
    let lastTime: number | undefined;

    const step = (time: number) => {
      if (lastTime !== undefined && !isPausedRef.current) {
        const half = halfWidthRef.current;
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

    // Touch handlers — native listeners required for { passive: false }
    const handleTouchStart = (e: TouchEvent) => {
      touchLastXRef.current = e.touches[0].clientX;
      isPausedRef.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchLastXRef.current === null) return;
      e.preventDefault(); // prevent page scroll while swiping the ticker

      const x = e.touches[0].clientX;
      const delta = touchLastXRef.current - x; // positive = scroll right
      touchLastXRef.current = x;

      const half = halfWidthRef.current;
      if (half > 0) {
        const newPos = scrollPosRef.current + delta;
        scrollPosRef.current = ((newPos % half) + half) % half;
        el.scrollLeft = scrollPosRef.current;
      }
    };

    const handleTouchEnd = () => {
      touchLastXRef.current = null;
      resumeTimerRef.current = setTimeout(() => {
        isPausedRef.current = false;
      }, RESUME_DELAY_MS);
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
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

      const half = halfWidthRef.current;
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
