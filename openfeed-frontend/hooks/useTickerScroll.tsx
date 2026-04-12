import { useRef, useEffect, useCallback } from "react";

const TICKER_SPEED = 0.01; // px/ms — now stutter-free at any speed
const RESUME_DELAY_MS = 1500;

export function useTickerScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const posRef = useRef(0);
  const halfWidthRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchLastXRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const observer = new ResizeObserver(() => {
      halfWidthRef.current = inner.scrollWidth / 2;
    });
    observer.observe(inner);
    halfWidthRef.current = inner.scrollWidth / 2;

    let animId: number;
    let lastTime: number | undefined;

    const step = (time: number) => {
      if (lastTime !== undefined && !isPausedRef.current) {
        const half = halfWidthRef.current;
        if (half > 0) {
          posRef.current += (time - lastTime) * TICKER_SPEED;
          if (posRef.current >= half) posRef.current -= half;
          inner.style.transform = `translateX(-${posRef.current}px)`;
        }
      }
      lastTime = time;
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    const handleTouchStart = (e: TouchEvent) => {
      touchLastXRef.current = e.touches[0].clientX;
      isPausedRef.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchLastXRef.current === null) return;
      e.preventDefault();

      const x = e.touches[0].clientX;
      const delta = touchLastXRef.current - x;
      touchLastXRef.current = x;

      const half = halfWidthRef.current;
      if (half > 0) {
        const newPos = posRef.current + delta;
        posRef.current = ((newPos % half) + half) % half;
        inner.style.transform = `translateX(-${posRef.current}px)`;
      }
    };

    const handleTouchEnd = () => {
      touchLastXRef.current = null;
      resumeTimerRef.current = setTimeout(() => {
        isPausedRef.current = false;
      }, RESUME_DELAY_MS);
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
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
      const inner = innerRef.current;
      if (!inner) return;

      pause();
      scheduleResume();

      const half = halfWidthRef.current;
      if (half > 0) {
        const delta = e.deltaX || e.deltaY;
        const newPos = posRef.current + delta;
        posRef.current = ((newPos % half) + half) % half;
        inner.style.transform = `translateX(-${posRef.current}px)`;
      }
    },
    [pause, scheduleResume],
  );

  return { containerRef, innerRef, pause, resume, handleWheel };
}
