"use client";

import { useRouter } from "next/navigation";
import { useTransition, useOptimistic } from "react";

import { InterestArticles } from "@/lib/supabase/queries/global_articles";

import SectionInterest from "@/components/SectionInterest";
import { SectionArticleSkeleton } from "@/components/SectionArticles";

export interface ViewFeedProps {
  interestArticles: InterestArticles[];
  handleDeleteInterest: (interestId: string) => Promise<void>;
  handleReadUserArticles: (
    articleIds: string[],
    isRead: boolean,
  ) => Promise<void>;
  handleCreateShareLink: (
    contentType: "article" | "story",
    contentId: string,
  ) => Promise<string>;
}

export function ViewFeed({
  interestArticles,
  handleDeleteInterest,
  handleReadUserArticles,
  handleCreateShareLink,
}: ViewFeedProps) {
  const router = useRouter();

  const [deleting, startDeleteTransition] = useTransition();

  const [optimisticInterests, removeOptimisticInterest] = useOptimistic(
    interestArticles,
    (current: InterestArticles[], deletedId: string) =>
      current.filter((interest) => interest.id !== deletedId),
  );

  const handleDelete = (interestId: string) => {
    startDeleteTransition(async () => {
      removeOptimisticInterest(interestId);
      await handleDeleteInterest(interestId);
      router.refresh();
    });
  };

  const handleRead = async (articleIds: string[], isRead: boolean) => {
    await handleReadUserArticles(articleIds, isRead);
    router.refresh();
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
          const aHasUnread = a.articles.some((article) => !article.is_read);
          const bHasUnread = b.articles.some((article) => !article.is_read);
          return Number(bHasUnread) - Number(aHasUnread);
        })
        .map((interest) => (
          <SectionInterest
            key={interest.id}
            interest={interest}
            deleting={deleting}
            handleCreateShareLink={handleCreateShareLink}
            handleDeleteInterest={handleDelete}
            handleReadArticles={handleRead}
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
