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
      a && articleIds.includes(a.global_articles.id)
        ? { ...a, is_read: !isRead }
        : a,
    );
    setLocalArticles(updated);
    updateActiveUnreadStatus(updated);
    startReadTransition(async () => {
      await handleReadArticles(articleIds, isRead);
    });
  };

  const handleReadAllArticles = () => {
    const unreadIds = unreadArticles.map((a) => a.global_articles.id);
    if (unreadIds.length === 0) return;
    wrappedHandleReadArticles(unreadIds, false);
  };

  const unreadArticles = localArticles.filter((a) => a && !a.is_read);
  const readArticles = localArticles.filter((a) => a && a.is_read);

  return (
    <div className="flex flex-col gap-8">
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
      <Toolbar
        handleReadAllArticles={handleReadAllArticles}
        allRead={unreadArticles.length === 0}
      />
      <div className="flex flex-col gap-8">
        {/* Unread Articles */}
        <div className="collapse collapse-arrow rounded-none">
          <input type="checkbox" defaultChecked />
          <span className="collapse-title pb-4 mb-4 border-b border-base-300 font-bold text-base-content/60">
            Unread Articles
          </span>
          <ul className="collapse-content p-0 flex flex-col gap-2">
            {unreadArticles.map((article) => (
              <li key={article.global_articles.id}>
                <CardArticle
                  key={article.global_articles.id}
                  article={article}
                  handleReadArticles={wrappedHandleReadArticles}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Read Articles */}
        <div className="collapse collapse-arrow rounded-none">
          <input type="checkbox" />
          <span className="collapse-title pb-4 mb-4 border-b border-base-300 font-bold text-base-content/60">
            Read Articles
          </span>
          <ul className="collapse-content p-0 flex flex-col gap-2">
            {readArticles.map((article) => (
              <CardArticle
                key={article.global_articles.id}
                article={article}
                handleReadArticles={wrappedHandleReadArticles}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
