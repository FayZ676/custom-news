"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";

import { Article } from "@/lib/backend";
import { Database } from "@/lib/supabase/supabase.types";
import { getCurrentDate, getUserLocation } from "@/lib/utils";

import { useDrawerInterests } from "@/hooks/useDrawerInterest";

import Banner from "@/components/Banner";
import { Navbar } from "@/components/Navbar";
import SearchBar from "@/components/Searchbar";
import { NavbarSkeleton } from "@/components/Navbar";
import { SearchbarSkeleton } from "@/components/Searchbar";
import { DrawerMenu, DrawerMenuProps } from "@/components/DrawerMenu";
import { CardArticle, CardArticleSkeleton } from "@/components/CardArticle";

export function ViewFeed({
  feeds,
  drawerMenuProps,
  articles,
  title,
  handleSaveUserInterest,
  articlesPerInterest,
  rightSlot,
}: {
  feeds: Database["public"]["Tables"]["global_feeds"]["Row"][];
  drawerMenuProps: DrawerMenuProps;
  articles: Article[];
  title: string;
  handleSaveUserInterest: (query: string) => Promise<string>;
  articlesPerInterest: number;
  rightSlot?: React.ReactNode;
  page?: number;
  hasMore?: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [date] = useState(getCurrentDate());
  const [location, setLocation] = useState("Locating...");

  const { drawerInterests, addTempInterest, confirmInterest } =
    useDrawerInterests(drawerMenuProps.interests);

  const [saving, startSaveTransition] = useTransition();
  const [isSearching, startSearchTransition] = useTransition();

  useEffect(() => {
    getUserLocation().then(setLocation);
  }, []);

  const handleSearch = (query: string) => {
    startSearchTransition(() => {
      router.push(`/feed?query=${encodeURIComponent(query)}`);
    });
  };

  const handleClear = () => {
    startSearchTransition(() => {
      router.push("/feed");
    });
  };

  const handleSave = (query: string) => {
    const tempId = `temp-${Date.now()}`;
    setSaved(false);
    addTempInterest(tempId, query, articlesPerInterest);
    startSaveTransition(async () => {
      const interestId = await handleSaveUserInterest(query);
      confirmInterest(tempId, interestId, query, articlesPerInterest);
      setSaved(true);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <Navbar
        left={<DrawerMenu {...drawerMenuProps} interests={drawerInterests} />}
        center={
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
        }
        right={rightSlot}
      />
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
              <CardArticleSkeleton key={i} />
            ))}
          </>
        ) : articles.length > 0 ? (
          <>
            {articles.map((article) => (
              <CardArticle key={article.global_articles.id} article={article} />
            ))}
          </>
        ) : (
          <></>
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
          <CardArticleSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
