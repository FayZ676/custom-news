"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useUnreadCount } from "@/components/UnreadCountContext";

type Tab = "my-news" | "trending" | "search";

const tabs: { id: Tab; label: (unreadCount: number | null) => string }[] = [
  { id: "trending", label: () => "Trending Stories" },
  {
    id: "my-news",
    label: (count) =>
      count != null && count > 0
        ? `My Articles (${count > 99 ? "99+" : count})`
        : "My Articles",
  },
  { id: "search", label: () => "Search" },
];

export function TabSwitcher() {
  const { unreadCount } = useUnreadCount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [optimisticTab, setOptimisticTab] = useState<Tab | null>(null);

  const rawTab = searchParams.get("tab");
  const committedTab: Tab =
    rawTab === "my-news" || rawTab === "search" ? rawTab : "trending";
  const activeTab = optimisticTab ?? committedTab;

  const handleTabClick = (tab: Tab) => {
    if (tab === activeTab) return;
    setOptimisticTab(tab);
    startTransition(() => {
      router.push(`/feed?tab=${tab}`);
      setOptimisticTab(null);
    });
  };

  const tabClass = (id: Tab) =>
    [
      "tab p-0 leading-none",
      "text-[clamp(13px,4vw,15px)] min-[400px]:text-lg",
      "[text-box-trim:trim-both] [text-box-edge:cap_alphabetic]",
      activeTab === id ? "tab-active" : "",
      "cursor-pointer",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div
      role="tablist"
      className={`tabs tabs-border tabs-md font-bold gap-4 justify-center transition-opacity ${isPending ? "opacity-60" : ""}`}
    >
      {tabs.map(({ id, label }) => (
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
  );
}
