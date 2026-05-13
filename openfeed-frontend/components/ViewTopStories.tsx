"use client";

import { useRef } from "react";

import { Tables } from "@/lib/supabase/supabase.types";

import {
  NewsItemModal,
  NewsItemModalHandle,
  NewsItemStory,
} from "@/components/NewsItemModal";
import { SectionArticleSkeleton } from "@/components/SectionArticles";
import { NewsItemCard } from "@/components/NewsItemCard";

interface ViewTopStoriesProps {
  stories: Tables<"global_stories">[];
}

export function ViewTopStories({ stories }: ViewTopStoriesProps) {
  const modalRef = useRef<NewsItemModalHandle>(null);

  function openModal(story: Tables<"global_stories">) {
    const item: NewsItemStory = {
      type: "story",
      id: story.id,
      headline: story.headline,
      summary: story.summary,
      articleUrls: story.related_articles_urls as string[],
      imageUrl: story.image_url,
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
      <ol className="flex flex-col gap-3 sm:gap-4">
        {storiesOrdered.map((story) => (
          <NewsItemCard
            key={story.id}
            title={story.headline}
            imageUrl={story.image_url}
            summary={story.summary}
            onClick={() => openModal(story)}
          />
        ))}
      </ol>

      <NewsItemModal ref={modalRef} />
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
