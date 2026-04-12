"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { Tables } from "@/lib/supabase/supabase.types";

interface ViewTopStoriesProps {
  stories: Tables<"global_stories">[];
}

export function ViewTopStories({ stories }: ViewTopStoriesProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedStory, setSelectedStory] =
    useState<Tables<"global_stories"> | null>(null);

  function openModal(story: Tables<"global_stories">) {
    setSelectedStory(story);
    dialogRef.current?.showModal();
  }

  return (
    <>
      <section className="flex items-start gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {stories.map((story) => (
          <div
            key={story.id}
            className="shrink-0 w-36 sm:w-44 lg:w-60 h-28 sm:h-28 lg:h-24 border p-2 cursor-pointer overflow-hidden"
            onClick={() => openModal(story)}
          >
            <p className="text-xs lg:text-sm font-bold leading-snug">
              {story.headline}
            </p>
            <p className="mt-1 text-xs font-light text-neutral-500 line-clamp-2">
              {story.summary}
            </p>
          </div>
        ))}
      </section>

      <dialog
        ref={dialogRef}
        className="modal modal-bottom sm:modal-middle rounded-none"
      >
        <div className="modal-box rounded-none">
          {selectedStory && (
            <>
              <form method="dialog">
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                  ✕
                </button>
              </form>

              <h3 className="font-bold text-base leading-snug pr-6">
                {selectedStory.headline}
              </h3>

              <p className="mt-3 text-sm font-light leading-relaxed">
                {selectedStory.summary}
              </p>

              {selectedStory.related_articles_urls &&
                selectedStory.related_articles_urls.length > 0 && (
                  <div className="pt-4">
                    <div className="flex flex-wrap gap-2">
                      {(selectedStory.related_articles_urls as string[]).map(
                        (url, i) => (
                          <Link
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline hover:underline"
                          >
                            Source {i + 1}
                          </Link>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>

        {/* Close on backdrop click */}
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}

export function ViewTopStoriesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <section className="flex items-start gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-36 sm:w-44 lg:w-60 h-28 sm:h-28 lg:h-24 border border-neutral-300 p-2 flex flex-col gap-2"
        >
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
          <div className="skeleton h-2 w-full rounded mt-1" />
          <div className="skeleton h-2 w-3/4 rounded" />
        </div>
      ))}
    </section>
  );
}
