"use client";

import { useState, useTransition } from "react";

import type { Article } from "@/lib/backend";
import { addInterest } from "@/actions/interests";

import SearchBar from "@/components/Searchbar";
import { Navbar } from "@/components/Navbar";
import { DrawerMenu } from "@/components/DrawerMenu";
import { CardArticle } from "@/components/CardArticle";

type Interest = { id: string; query: string };

export function FeedView({
  initialInterests,
  articles,
  title,
  rightSlot,
  pagination,
}: {
  initialInterests: Interest[];
  articles: Article[];
  title: string;
  rightSlot?: React.ReactNode;
  pagination?: React.ReactNode;
}) {
  const [interests, setInterests] = useState<Interest[]>(initialInterests);
  const [saving, startSaveTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = (query: string) => {
    const tempId = `temp-${Date.now()}`;
    setSaved(false);
    setInterests((prev) => [...prev, { id: tempId, query }]);
    startSaveTransition(async () => {
      const realId = await addInterest(query);
      setInterests((prev) =>
        prev.map((i) => (i.id === tempId ? { id: realId, query } : i)),
      );
      setSaved(true);
    });
  };

  return (
    <div className="flex flex-col">
      <Navbar
        left={<DrawerMenu interests={interests} />}
        center={<span className="text-xl font-semibold">{title}</span>}
        right={rightSlot}
      />
      <SearchBar onSave={handleSave} saving={saving} saved={saved} />
      <div className="flex flex-col gap-2 p-4">
        {articles.length ? (
          articles.map((article) => (
            <CardArticle key={article.id} article={article} />
          ))
        ) : (
          <p className="text-center text-base-content/50 py-8">
            No articles found.
          </p>
        )}
      </div>
      {pagination}
    </div>
  );
}
