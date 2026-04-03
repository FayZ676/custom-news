"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Search } from "lucide-react";

import { deleteInterest } from "@/actions/interests";

import type { Article, Interest } from "@/lib/backend";

import { useDrawerInterests } from "@/hooks/useDrawerInterest";

import Fab from "@/components/Fab";
import { Navbar } from "@/components/Navbar";
import { NavbarSkeleton } from "@/components/Navbar";
import { CardArticle } from "@/components/CardArticle";
import { DrawerOptions } from "@/components/DrawerOptions";
import { CardArticleSkeleton } from "@/components/CardArticle";
import { DrawerMenu, DrawerMenuProps } from "@/components/DrawerMenu";

export function ViewInterestFeed({
  drawerMenuProps,
  activeInterest,
  articles,
  handleReadArticles,
}: {
  drawerMenuProps: DrawerMenuProps;
  activeInterest: Interest;
  articles: Article[];
  handleReadArticles: (articleIds: string[], isRead: boolean) => Promise<void>;
}) {
  const router = useRouter();

  const [localArticles, setLocalArticles] = useState<Article[]>(articles);
  const { drawerInterests, removeInterest, updateUnreadCount } =
    useDrawerInterests(drawerMenuProps.interests);

  const [, startReadTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();

  const updateActiveUnreadStatus = (updatedArticles: Article[]) => {
    const count = updatedArticles.filter((a) => a && !a.is_read).length;
    updateUnreadCount(activeInterest.id, count);
  };

  const handleDeleteArticle = () => {
    removeInterest(activeInterest.id);
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

  const unreadArticles = localArticles.filter((a) => a && !a.is_read);
  const readArticles = localArticles.filter((a) => a && a.is_read);

  return (
    <>
      <div className="md:hidden">
        <Fab />
      </div>
      <div className="flex flex-col gap-8">
        <Navbar
          left={<DrawerMenu {...drawerMenuProps} interests={drawerInterests} />}
          center={
            <div className="flex gap-2 items-center min-w-0">
              <span className="text-xl font-semibold truncate">
                {activeInterest.query}
              </span>
              <div className="hidden md:block">
                <Link href="/feed" className="btn btn-circle btn-accent">
                  <Search size={16} strokeWidth={3} />
                </Link>
              </div>
            </div>
          }
          right={
            <DrawerOptions
              onDelete={handleDeleteArticle}
              isPending={deleting}
            />
          }
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
    </>
  );
}

export function ViewInterestFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-8">
      <NavbarSkeleton />
      <div className="flex flex-col gap-8">
        <div className="collapse collapse-arrow rounded-none">
          <span className="collapse-title pb-4 mb-4 border-b border-base-300 font-bold text-base-content/60">
            Unread Articles
          </span>
          <div className="collapse-content p-0 flex flex-col gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <CardArticleSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="collapse collapse-arrow rounded-none">
          <span className="collapse-title pb-4 mb-4 border-b border-base-300 font-bold text-base-content/60">
            Read Articles
          </span>
          <div className="collapse-content p-0 flex flex-col gap-2" />
        </div>
      </div>
    </div>
  );
}
