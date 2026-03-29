"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteInterest } from "@/actions/interests";

import type { Article, Interest } from "@/lib/backend";

import Toolbar from "@/components/Toolbar";
import { Navbar } from "@/components/Navbar";
import { CardArticle } from "@/components/CardArticle";
import { DrawerOptions } from "@/components/DrawerOptions";
import { DrawerMenu, DrawerMenuInterest } from "@/components/DrawerMenu";

export function ViewInterestFeed({
  initialDrawerInterests,
  activeInterest,
  articles,
  handleReadArticles,
}: {
  initialDrawerInterests: DrawerMenuInterest[];
  activeInterest: Interest;
  articles: Article[];
  handleReadArticles: (articleIds: string[], isRead: boolean) => Promise<void>;
}) {
  const router = useRouter();

  const [localArticles, setLocalArticles] = useState<Article[]>(articles);
  const [drawerInterests, setDrawerInterests] = useState<DrawerMenuInterest[]>(
    initialDrawerInterests,
  );

  const [, startReadTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();

  const updateActiveUnreadStatus = (updatedArticles: Article[]) => {
    const unreadArticlesCount = updatedArticles.filter(
      (a) => a && !a.is_read,
    ).length;
    setDrawerInterests((prev) =>
      prev.map((di) =>
        di.interest.id === activeInterest.id
          ? { ...di, unreadArticlesCount: unreadArticlesCount }
          : di,
      ),
    );
  };

  const handleDeleteArticle = () => {
    setDrawerInterests((prev) =>
      prev.filter((di) => di.interest.id !== activeInterest.id),
    );
    startDeleteTransition(async () => {
      await deleteInterest(activeInterest.id);
      router.push("/feed");
    });
  };

  const wrappedHandleReadArticles = (articleIds: string[], isRead: boolean) => {
    const updated = localArticles.map((a) =>
      a && articleIds.includes(a.id) ? { ...a, is_read: !isRead } : a,
    );
    setLocalArticles(updated);
    updateActiveUnreadStatus(updated);
    startReadTransition(async () => {
      await handleReadArticles(articleIds, isRead);
    });
  };

  const handleReadAllArticles = () => {
    const unreadIds = localArticles
      .filter((a) => a && !a.is_read)
      .map((a) => a.id);
    if (unreadIds.length === 0) return;
    wrappedHandleReadArticles(unreadIds, false);
  };

  return (
    <div className="flex flex-col">
      <Navbar
        left={<DrawerMenu interests={drawerInterests} />}
        center={
          <span className="text-xl font-semibold text-center wrap-break-word">
            {activeInterest.query}
          </span>
        }
        right={
          <DrawerOptions onDelete={handleDeleteArticle} isPending={deleting} />
        }
      />
      <div className="flex flex-col gap-2 p-4">
        <Toolbar
          handleReadAllArticles={handleReadAllArticles}
          allRead={localArticles.every((a) => !a || a.is_read)}
        />
        {localArticles?.length ? (
          localArticles.map((article) =>
            article ? (
              <CardArticle
                key={article.id}
                article={article}
                handleReadArticles={wrappedHandleReadArticles}
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
