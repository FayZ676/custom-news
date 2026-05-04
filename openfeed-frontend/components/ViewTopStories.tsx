"use client";

import { useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";

import { Tables } from "@/lib/supabase/supabase.types";

import {
  NewsItemModal,
  NewsItemModalHandle,
  NewsItemStory,
} from "@/components/NewsItemModal";
import { SectionArticleSkeleton } from "@/components/SectionArticles";

interface ViewTopStoriesProps {
  stories: Tables<"global_stories">[];
  handleCreateShareLink: (
    contentType: "article" | "story",
    contentId: string,
  ) => Promise<string>;
}

type TrendIndicator = {
  label: string;
  icon: React.ReactNode;
};

// Velocity = mean(e^(-λ·age)) - neutral_baseline, where λ = log(2)/36h.
// Range is approximately [-0.54, +0.46] for a 72h clustering window.
function getTrendIndicator(velocity: number): TrendIndicator {
  if (velocity > 0.3) {
    return {
      label: "Rising fast",
      icon: <ChevronsUp className="inline w-4 h-4 text-green-500" />,
    };
  } else if (velocity > 0.1) {
    return {
      label: "Rising",
      icon: <TrendingUp className="inline w-4 h-4 text-green-400" />,
    };
  } else if (velocity >= -0.1) {
    return {
      label: "Steady",
      icon: <Minus className="inline w-4 h-4 text-yellow-500" />,
    };
  } else if (velocity >= -0.3) {
    return {
      label: "Falling",
      icon: <TrendingDown className="inline w-4 h-4 text-red-400" />,
    };
  } else {
    return {
      label: "Falling fast",
      icon: <ChevronsDown className="inline w-4 h-4 text-red-500" />,
    };
  }
}

export function ViewTopStories({
  stories,
  handleCreateShareLink,
}: ViewTopStoriesProps) {
  const modalRef = useRef<NewsItemModalHandle>(null);

  function openModal(story: Tables<"global_stories">) {
    const item: NewsItemStory = {
      type: "story",
      id: story.id,
      headline: story.headline,
      summary: story.summary,
      articleUrls: story.related_articles_urls as string[],
    };
    modalRef.current?.open(item);
  }

  const storiesOrdered = [...stories].sort((a, b) => b.score - a.score);

  if (storiesOrdered.length === 0) {
    return (
      <p className="text-sm italic text-neutral-500">
        No trending stories available right now.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <ol className="flex flex-col gap-4">
        {storiesOrdered.map((story) => {
          const trend = getTrendIndicator(story.velocity);
          return (
            <li
              key={story.id}
              className="flex flex-col gap-2 cursor-pointer"
              onClick={() => openModal(story)}
            >
              <div className="flex gap-2 justify-between items-center">
                <h2 className="text-lg hover:underline font-semibold">
                  {story.headline}
                </h2>
                <span title={trend.label}>{trend.icon}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <NewsItemModal
        ref={modalRef}
        handleCreateShareLink={handleCreateShareLink}
      />
    </section>
  );
}

export function ViewTopStoriesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <section className="flex flex-col gap-4">
      <ol className="flex flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i}>
            <SectionArticleSkeleton />
          </li>
        ))}
      </ol>
    </section>
  );
}
