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

const HERO_THRESHOLD = 0.9;
const FEATURED_THRESHOLD = 0.6;

interface ViewTopStoriesProps {
  stories: Tables<"global_stories">[];
  categoryOrder?: string[];
}

export function ViewTopStories({
  stories,
  categoryOrder = [],
}: ViewTopStoriesProps) {
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

  const categoryIndex = (story: Tables<"global_stories">) => {
    if (!story.category_name) return categoryOrder.length;
    const idx = categoryOrder.indexOf(story.category_name);
    return idx === -1 ? categoryOrder.length : idx;
  };

  const storiesOrdered = [...stories].sort((a, b) => {
    const catDiff = categoryIndex(a) - categoryIndex(b);
    if (catDiff !== 0) return catDiff;
    return b.score - a.score;
  });

  if (storiesOrdered.length === 0) {
    return (
      <p className="text-sm italic text-neutral-500">
        No trending stories available right now.
      </p>
    );
  }

  const heroStories = storiesOrdered.filter((s) => s.score >= HERO_THRESHOLD);
  const featuredStories = storiesOrdered.filter(
    (s) => s.score >= FEATURED_THRESHOLD && s.score < HERO_THRESHOLD,
  );
  const compactStories = storiesOrdered.filter(
    (s) => s.score < FEATURED_THRESHOLD,
  );

  return (
    <section className="flex flex-col">
      {heroStories.length > 0 && (
        <ol className="flex flex-col gap-6 pb-6">
          {heroStories.map((story) => (
            <NewsItemCard
              key={story.id}
              variant="hero"
              title={story.headline}
              imageUrl={story.image_url}
              summary={story.summary}
              onClick={() => openModal(story)}
            />
          ))}
        </ol>
      )}

      {featuredStories.length > 0 && (
        <>
          {heroStories.length > 0 && (
            <hr className="border-t border-neutral-700 mb-6" />
          )}
          <ol className="flex flex-col gap-4 pb-6">
            {featuredStories.map((story) => (
              <NewsItemCard
                key={story.id}
                variant="featured"
                title={story.headline}
                imageUrl={story.image_url}
                summary={story.summary}
                onClick={() => openModal(story)}
              />
            ))}
          </ol>
        </>
      )}

      {compactStories.length > 0 && (
        <>
          {(heroStories.length > 0 || featuredStories.length > 0) && (
            <hr className="border-t border-neutral-700 mb-4" />
          )}
          <ol className="flex flex-col gap-2">
            {compactStories.map((story) => (
              <NewsItemCard
                key={story.id}
                variant="compact"
                title={story.headline}
                imageUrl={story.image_url}
                summary={story.summary}
                onClick={() => openModal(story)}
              />
            ))}
          </ol>
        </>
      )}

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
