"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react";

import { Tables } from "@/lib/supabase/supabase.types";

import Modal from "@/components/Modal";
import { SectionArticleSkeleton } from "@/components/SectionArticles";

interface ViewTopStoriesProps {
  stories: Tables<"global_stories">[];
}

type TrendIndicator = {
  label: string;
  icon: React.ReactNode;
};

function getTrendIndicator(velocity: number): TrendIndicator {
  if (velocity > 0.01) {
    return {
      label: "Rising fast",
      icon: <ChevronsUp className="inline w-4 h-4 text-green-500" />,
    };
  } else if (velocity > 0.002) {
    return {
      label: "Rising",
      icon: <TrendingUp className="inline w-4 h-4 text-green-400" />,
    };
  } else if (velocity >= -0.002) {
    return {
      label: "Steady",
      icon: <Minus className="inline w-4 h-4 text-yellow-500" />,
    };
  } else if (velocity >= -0.01) {
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

export function ViewTopStories({ stories }: ViewTopStoriesProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedStory, setSelectedStory] =
    useState<Tables<"global_stories"> | null>(null);

  function openModal(story: Tables<"global_stories">) {
    setSelectedStory(story);
    dialogRef.current?.showModal();
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
              <h2 className="text-lg hover:underline font-semibold">
                {story.headline} <span title={trend.label}>{trend.icon}</span>
              </h2>
            </li>
          );
        })}
      </ol>

      <Modal ref={dialogRef}>
        {selectedStory && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-semibold pr-6">
              {selectedStory.headline}
            </h3>

            {selectedStory.summary && (
              <p className="text-base leading-relaxed">
                {selectedStory.summary}
              </p>
            )}

            {(selectedStory.related_articles_urls as string[]).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(selectedStory.related_articles_urls as string[]).map(
                  (url, i) => (
                    <Link
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline"
                    >
                      Article {i + 1}
                    </Link>
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
}

export function ViewTopStoriesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <section className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SectionArticleSkeleton key={i} />
      ))}
    </section>
  );
}
