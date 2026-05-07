"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useUnreadCount } from "@/components/UnreadCountContext";

type Tab = "my-news" | "trending" | "search";

interface TabSwitcherProps {
  trendingCount: number;
}

export function TabSwitcher({ trendingCount }: TabSwitcherProps) {
  const { unreadCount } = useUnreadCount();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: Tab =
    rawTab === "my-news" || rawTab === "search" ? rawTab : "trending";

  return (
    <div
      role="tablist"
      className="tabs tabs-border tabs-sm md:tabs-lg font-bold gap-4 text-sm sm:text-base md:text-lg"
    >
      <Link
        href="/feed?tab=trending"
        role="tab"
        prefetch={true}
        className={`tab ${tab === "trending" ? "tab-active" : ""} p-0 leading-none [text-box-trim:trim-both] [text-box-edge:cap_alphabetic]`}
      >
        Trending Stories ({trendingCount})
      </Link>
      <Link
        href="/feed?tab=my-news"
        role="tab"
        prefetch={true}
        className={`tab ${tab === "my-news" ? "tab-active" : ""} p-0 leading-none [text-box-trim:trim-both] [text-box-edge:cap_alphabetic]`}
      >
        {unreadCount != null && unreadCount > 0
          ? `My Articles (${unreadCount > 99 ? "99+" : unreadCount})`
          : "My Articles"}
      </Link>
      <Link
        href="/feed?tab=search"
        role="tab"
        prefetch={true}
        className={`tab ${tab === "search" ? "tab-active" : ""} p-0 leading-none [text-box-trim:trim-both] [text-box-edge:cap_alphabetic]`}
      >
        Search
      </Link>
    </div>
  );
}
