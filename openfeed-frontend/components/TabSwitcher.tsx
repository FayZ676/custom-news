"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useUnreadCount } from "@/components/UnreadCountContext";

type Tab = "my-news" | "trending" | "search";

interface TabSwitcherProps {
  trendingCount?: number;
}

const makeTabs = (
  trendingCount?: number,
): { id: Tab; label: (unreadCount: number | null) => string }[] => [
  {
    id: "trending",
    label: () =>
      trendingCount
        ? `Trending Stories (${trendingCount})`
        : "Trending Stories",
  },
  {
    id: "my-news",
    label: (count) =>
      count != null && count > 0
        ? `My Articles (${count > 99 ? "99+" : count})`
        : "My Articles",
  },
  { id: "search", label: () => "Search" },
];

export function TabSwitcher({ trendingCount }: TabSwitcherProps) {
  const { unreadCount } = useUnreadCount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const rawTab = searchParams.get("tab");
  const committedTab: Tab =
    rawTab === "my-news" || rawTab === "search" ? rawTab : "trending";

  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const activeTab = pendingTab ?? committedTab;

  // Clear optimistic state once navigation has committed
  if (pendingTab && pendingTab === committedTab) {
    setPendingTab(null);
  }

  const handleTabClick = (tab: Tab) => {
    if (tab === committedTab) return;
    setPendingTab(tab);
    startTransition(() => {
      router.push(`/feed?tab=${tab}`);
    });
  };

  const tabClass = (id: Tab) =>
    [
      "tab p-0 leading-none",
      "text-[clamp(13px,4vw,15px)] min-[400px]:text-lg",
      "[text-box-trim:trim-both] [text-box-edge:cap_alphabetic]",
      activeTab === id ? "tab-active" : "",
      isPending ? "cursor-wait" : "cursor-pointer",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <>
      <div
        role="tablist"
        className="tabs tabs-border tabs-md font-bold gap-4 justify-center"
      >
        {makeTabs(trendingCount).map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={tabClass(id)}
            onClick={() => handleTabClick(id)}
          >
            {label(unreadCount)}
          </button>
        ))}
      </div>

      {isPending && (
        <div
          className="pointer-events-none fixed inset-0 z-50 bg-base-100/30 transition-opacity"
          aria-hidden
        />
      )}
    </>
  );
}
