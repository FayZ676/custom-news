"use client";

import { startTransition, useOptimistic, useState } from "react";

import { EllipsisVertical } from "lucide-react";

import { toTitleCase } from "@/lib/utils";
import { InterestStory } from "@/lib/supabase/queries/user_stories";
import { InterestStories } from "@/lib/supabase/queries/user_interests";
import { Tables } from "@/lib/supabase/supabase.types";

import { ViewTopStories } from "@/components/ViewTopStories";

export interface SectionInterestProps {
  interest: InterestStories;
  deleting: boolean;
  handleDeleteInterest: (interestId: string) => void;
  handleReadStories: (storyIds: string[], isRead: boolean) => void;
}

export default function SectionInterest({
  interest,
  deleting,
  handleReadStories,
  handleDeleteInterest,
}: SectionInterestProps) {
  const [showReadStories, setShowReadStories] = useState<boolean>(false);
  const [optimisticStories, setOptimisticStories] = useOptimistic(
    interest.stories,
    (
      current: InterestStory[],
      { ids, isRead }: { ids: string[]; isRead: boolean },
    ) =>
      current.map((s) =>
        ids.includes(s.global_story.id) ? { ...s, is_read: isRead } : s,
      ),
  );

  const unreadStories = optimisticStories.filter((s) => !s.is_read);
  const readStories = optimisticStories.filter((s) => s.is_read);

  const toStoryRows = (items: InterestStory[]) =>
    items.map((s) => s.global_story);

  const handleToggleReadOptimistic = async (
    storyIds: string[],
    isRead: boolean,
  ) => {
    startTransition(() => {
      setOptimisticStories({ ids: storyIds, isRead });
    });
    await handleReadStories(storyIds, isRead);
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = unreadStories.map((s) => s.global_story.id);
    startTransition(() => {
      setOptimisticStories({ ids: unreadIds, isRead: true });
    });
    await handleReadStories(unreadIds, true);
  };

  return (
    <div className="flex flex-col gap-4 pb-6 border-neutral-300 border-b">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">{toTitleCase(interest.query)}</h1>
        <details className="dropdown dropdown-bottom dropdown-end">
          <summary
            role="button"
            className="btn btn-ghost m-1 rounded-none p-2 list-none"
          >
            <EllipsisVertical />
          </summary>
          <ul className="dropdown-content menu bg-base-100 rounded-none border z-1 w-52 p-2 shadow-sm">
            <li>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  (
                    e.currentTarget.closest("details") as HTMLDetailsElement
                  ).open = false;
                  setShowReadStories(!showReadStories);
                }}
                className="rounded-none"
              >
                {showReadStories ? "Hide" : "Show"} Read Stories
              </button>
            </li>
            <li>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  (
                    e.currentTarget.closest("details") as HTMLDetailsElement
                  ).open = false;
                  handleMarkAllAsRead();
                }}
                className="rounded-none"
              >
                Mark all as Read
              </button>
            </li>
            <li>
              <button
                disabled={deleting}
                onClick={async (e) => {
                  e.preventDefault();
                  (
                    e.currentTarget.closest("details") as HTMLDetailsElement
                  ).open = false;
                  handleDeleteInterest(interest.id);
                }}
                className="rounded-none"
              >
                Delete Interest
              </button>
            </li>
          </ul>
        </details>
      </div>
      {unreadStories.length > 0 ? (
        <ViewTopStories
          stories={toStoryRows(unreadStories)}
          onStoryRead={(id) => handleToggleReadOptimistic([id], true)}
        />
      ) : (
        <p className="italic">All caught up</p>
      )}
      {showReadStories && (
        <>
          <div className="flex items-center gap-2">
            <hr className="flex-1" />
            <span className="text-sm italic">Read Stories</span>
            <hr className="flex-1" />
          </div>
          <ViewTopStories stories={toStoryRows(readStories)} />
        </>
      )}
    </div>
  );
}
