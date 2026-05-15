"use client";

import { useRouter } from "next/navigation";
import { useTransition, useOptimistic } from "react";

import { InterestStories } from "@/lib/supabase/queries/user_interests";
import { useUnreadCount } from "@/components/UnreadCountContext";

import SectionInterest from "@/components/SectionInterest";
import { SectionArticleSkeleton } from "@/components/SectionArticles";

export interface ViewFeedProps {
  interestStories: InterestStories[];
  handleDeleteInterest: (interestId: string) => Promise<void>;
  handleReadUserStories: (storyIds: string[], isRead: boolean) => Promise<void>;
}

export function ViewFeed({
  interestStories,
  handleDeleteInterest,
  handleReadUserStories,
}: ViewFeedProps) {
  const router = useRouter();
  const { adjustCount } = useUnreadCount();

  const [deleting, startDeleteTransition] = useTransition();

  const [optimisticInterests, removeOptimisticInterest] = useOptimistic(
    interestStories,
    (current: InterestStories[], deletedId: string) =>
      current.filter((interest) => interest.id !== deletedId),
  );

  const handleDelete = (interestId: string) => {
    startDeleteTransition(async () => {
      const interest = optimisticInterests.find((i) => i.id === interestId);
      const unreadCount =
        interest?.stories.filter((s) => !s.is_read).length ?? 0;
      adjustCount(-unreadCount);
      removeOptimisticInterest(interestId);
      await handleDeleteInterest(interestId);
      router.refresh();
    });
  };

  const handleRead = async (storyIds: string[], isRead: boolean) => {
    const unreadCountDelta = isRead ? -storyIds.length : storyIds.length;
    adjustCount(unreadCountDelta);
    try {
      await handleReadUserStories(storyIds, isRead);
      router.refresh();
    } catch (error) {
      adjustCount(-unreadCountDelta);
      throw error;
    }
  };

  if (optimisticInterests.length === 0) {
    return (
      <p className="text-sm italic text-neutral-500">
        No interests yet. Use the{" "}
        <span className="font-semibold not-italic">Search</span> tab to find
        topics and save them to your news feed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {optimisticInterests
        .slice()
        .sort((a, b) => {
          const aHasUnread = a.stories.some((s) => !s.is_read);
          const bHasUnread = b.stories.some((s) => !s.is_read);
          return Number(bHasUnread) - Number(aHasUnread);
        })
        .map((interest) => (
          <SectionInterest
            key={interest.id}
            interest={interest}
            deleting={deleting}
            handleDeleteInterest={handleDelete}
            handleReadStories={handleRead}
          />
        ))}
    </div>
  );
}

export function ViewFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SectionArticleSkeleton key={i} />
      ))}
    </div>
  );
}
