"use client";

import { useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { StoryWithTopics } from "@/lib/supabase/queries/global_stories";
import { hideStory } from "@/lib/supabase/queries/user_stories_hidden";
import {
  addDislikedTopics,
  addLikedTopics,
} from "@/lib/supabase/queries/user_topic_preferences";

import {
  NewsItemModal,
  NewsItemModalHandle,
  NewsItemStory,
} from "@/components/NewsItemModal";
import { SectionArticleSkeleton } from "@/components/SectionArticles";
import { NewsItemCard } from "@/components/NewsItemCard";

const HERO_THRESHOLD = 0.9;
const FEATURED_THRESHOLD = 0.6;

interface ViewFeedProps {
  stories: StoryWithTopics[];
  userId?: string;
  onStoryRead?: (storyId: string) => void;
}

export function ViewFeed({ stories, userId, onStoryRead }: ViewFeedProps) {
  const modalRef = useRef<NewsItemModalHandle>(null);
  const pendingReadId = useRef<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  function openModal(story: StoryWithTopics) {
    const item: NewsItemStory = {
      type: "story",
      id: story.id,
      headline: story.headline,
      summary: story.summary,
      articleUrls: story.related_articles_urls as string[],
      imageUrl: story.image_url,
    };
    pendingReadId.current = story.id;
    modalRef.current?.open(item, {
      onLike: userId ? () => handleLike(story) : undefined,
      onDislike: userId ? () => handleDislike(story) : undefined,
    });
  }

  function handleModalClose() {
    if (pendingReadId.current) {
      onStoryRead?.(pendingReadId.current);
      pendingReadId.current = null;
    }
  }

  function handleDislike(story: StoryWithTopics) {
    // Optimistically hide immediately
    setHiddenIds((prev) => new Set(prev).add(story.id));

    if (!userId) return;

    // Fire-and-forget writes to Supabase
    const supabase = createClient();
    hideStory(supabase, userId, story.id).catch(console.error);
    addDislikedTopics(supabase, userId, story.medtop_ids).catch(console.error);
  }

  function handleLike(story: StoryWithTopics) {
    if (!userId) return;
    const supabase = createClient();
    addLikedTopics(supabase, userId, story.medtop_ids).catch(console.error);
  }

  const visibleStories = stories.filter((s) => !hiddenIds.has(s.id));
  const storiesOrdered = [...visibleStories].sort(
    (a, b) => (b.final_score ?? b.score) - (a.final_score ?? a.score),
  );

  if (storiesOrdered.length === 0) {
    return (
      <p className="text-sm italic text-neutral-500">
        No stories available right now.
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

      <NewsItemModal ref={modalRef} onClose={handleModalClose} />
    </section>
  );
}

export function ViewFeedSkeleton({ count = 5 }: { count?: number }) {
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
