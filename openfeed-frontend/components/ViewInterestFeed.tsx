"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteInterest } from "@/actions/interests";
import type { Article } from "@/lib/backend";
import { FeedDrawer } from "@/components/Navbar";
import { MenuDrawer } from "@/components/DrawerMenu";
import { ArticleCard } from "@/components/CardArticle";
import { InterestOptionsDrawer } from "@/components/DrawerOptions";

type Interest = { id: string; query: string };

export function InterestFeedView({
  initialInterests,
  activeInterest,
  articles,
  handleOpenArticle,
}: {
  initialInterests: Interest[];
  activeInterest: Interest;
  articles: Article[];
  handleOpenArticle: (articleId: string, isRead: boolean) => Promise<void>;
}) {
  const router = useRouter();
  const [interests, setInterests] = useState<Interest[]>(initialInterests);
  const [deleting, startDeleteTransition] = useTransition();

  const handleDelete = () => {
    setInterests((prev) => prev.filter((i) => i.id !== activeInterest.id));
    startDeleteTransition(async () => {
      await deleteInterest(activeInterest.id);
      router.push("/feed");
    });
  };

  return (
    <div className="flex flex-col">
      <FeedDrawer
        left={<MenuDrawer interests={interests} />}
        center={
          <span className="text-xl font-semibold">{activeInterest.query}</span>
        }
        right={
          <InterestOptionsDrawer onDelete={handleDelete} isPending={deleting} />
        }
      />
      <div className="flex flex-col gap-2 p-4">
        {articles?.length ? (
          articles.map((article) =>
            article ? (
              <ArticleCard
                key={article.id}
                article={article}
                handleOpen={handleOpenArticle}
              />
            ) : null,
          )
        ) : (
          <p className="text-center text-base-content/50 py-8">
            No articles available.
          </p>
        )}
      </div>
    </div>
  );
}
