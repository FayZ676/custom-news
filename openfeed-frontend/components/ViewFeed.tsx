"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, useOptimistic } from "react";

import { InterestArticles, QueryArticle } from "@/lib/backend";
import { Database } from "@/lib/supabase/supabase.types";
import { getCurrentDate, getUserLocation } from "@/lib/utils";

import Banner from "@/components/Banner";
import SearchBar from "@/components/Searchbar";
import { NavbarSkeleton } from "@/components/Navbar";
import SectionInterest from "@/components/SectionInterest";
import {
  SectionArticles,
  SectionArticleSkeleton,
} from "@/components/SectionArticles";
import { SearchbarSkeleton } from "@/components/Searchbar";

export interface ViewFeedProps {
  feeds: Database["public"]["Tables"]["global_feeds"]["Row"][];
  queryArticles: QueryArticle[];
  interestArticles: InterestArticles[];
  handleDeleteInterest: (interestId: string) => Promise<void>;
  handleSaveUserInterest: (query: string) => Promise<string>;
  handleReadUserArticles: (
    articleIds: string[],
    isRead: boolean,
  ) => Promise<void>;
}

export function ViewFeed({
  feeds,
  queryArticles,
  interestArticles,
  handleDeleteInterest,
  handleReadUserArticles,
  handleSaveUserInterest,
}: ViewFeedProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [date] = useState(getCurrentDate());
  const [location, setLocation] = useState("Locating...");

  const [saving, startSaveTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();

  const [optimisticInterests, removeOptimisticInterest] = useOptimistic(
    interestArticles,
    (current: InterestArticles[], deletedId: string) =>
      current.filter((interest) => interest.id !== deletedId),
  );

  useEffect(() => {
    getUserLocation().then(setLocation);
  }, []);

  const handleSearch = (query: string) => {
    startSearchTransition(() => {
      router.push(`/feed?query=${encodeURIComponent(query)}`);
    });
  };

  const handleSave = (query: string) => {
    setSaved(false);
    startSaveTransition(async () => {
      await handleSaveUserInterest(query);
      setSaved(true);
      router.push("/feed");
    });
  };

  const handleDelete = (interestId: string) => {
    startDeleteTransition(async () => {
      removeOptimisticInterest(interestId);
      await handleDeleteInterest(interestId);
      router.refresh();
    });
  };

  const handleClear = () => {
    startSearchTransition(() => {
      router.push("/feed");
    });
  };

  const handleRead = async (articleIds: string[], isRead: boolean) => {
    await handleReadUserArticles(articleIds, isRead);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-center">
        <Image
          src={"logo.svg"}
          alt="The Latest Times"
          width={300}
          height={300}
          loading="eager"
          style={{ height: "auto" }}
        />
      </div>
      <Banner location={location} date={date} feeds={feeds} />
      <SearchBar
        onSave={handleSave}
        saving={saving}
        saved={saved}
        onSearch={handleSearch}
        onClear={handleClear}
        searching={isSearching}
      />
      <div className="flex flex-col gap-2">
        {isSearching ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <SectionArticleSkeleton key={i} />
            ))}
          </>
        ) : queryArticles.length > 0 ? (
          <SectionArticles articles={queryArticles} />
        ) : (
          <>
            {optimisticInterests.map((interest) => (
              <SectionInterest
                key={interest.id}
                interest={interest}
                deleting={deleting}
                handleDeleteInterest={handleDelete}
                handleReadArticles={handleRead}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export function ViewFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-8">
      <NavbarSkeleton />
      <SearchbarSkeleton />
      <div className="flex flex-col gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <SectionArticleSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
