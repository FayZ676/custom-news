"use client";

import React from "react";
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

  const storiesOrdered = [...stories].sort(
    (a, b) => b.related_articles_urls.length - a.related_articles_urls.length,
  );

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-bold text-red-700">Trending News</h3>
      <div className="flex items-start gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {storiesOrdered.map((story, i) => (
          <React.Fragment key={story.id}>
            {i > 0 && (
              <div className="shrink-0 w-px self-stretch bg-neutral-400" />
            )}
            <p
              onClick={() => openModal(story)}
              className="shrink-0 w-36 sm:w-44 lg:w-60 cursor-pointer overflow-hidden text-sm lg:text-base leading-snug"
            >
              {story.headline}
            </p>
          </React.Fragment>
        ))}
      </div>

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
    </section>
  );
}

export function ViewTopStoriesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-bold text-neutral-400">Trending News</h3>
      <div className="flex items-start gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {Array.from({ length: count }).map((_, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className="shrink-0 w-px self-stretch bg-neutral-400" />
            )}
            <div className="shrink-0 w-36 sm:w-44 lg:w-60 flex flex-col gap-1.5">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-4/5 rounded" />
              <div className="skeleton h-3 w-3/5 rounded" />
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
