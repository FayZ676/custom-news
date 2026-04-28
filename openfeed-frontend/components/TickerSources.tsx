"use client";

import { Tables } from "@/lib/supabase/supabase.types";
import { useTickerScroll } from "@/hooks/useTickerScroll";

interface TickerSourcesProps {
  feeds: Tables<"global_feeds">[];
  renderItem?: (feed: Tables<"global_feeds">, index: number) => React.ReactNode;
}

const defaultRenderItem = (feed: Tables<"global_feeds">, i: number) => (
  <a key={`${feed.id}-${i}`} href={feed.url} className="px-2 italic">
    {feed.title}
  </a>
);

export function TickerSources({
  feeds,
  renderItem = defaultRenderItem,
}: TickerSourcesProps) {
  const { containerRef, innerRef, pause, resume, handleWheel } =
    useTickerScroll();

  return (
    <div
      ref={containerRef}
      className="overflow-hidden whitespace-nowrap text-sm cursor-ew-resize"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onWheel={handleWheel}
    >
      <div ref={innerRef} className="inline-flex will-change-transform">
        {[...feeds, ...feeds].map((feed, i) => renderItem(feed, i))}
      </div>
    </div>
  );
}
