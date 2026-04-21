"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Tab = "my-news" | "trending" | "search";

export function TabSwitcher() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: Tab =
    rawTab === "trending" || rawTab === "search" ? rawTab : "my-news";

  return (
    <div role="tablist" className="tabs tabs-border tabs-lg font-bold gap-4">
      <Link
        href="/feed?tab=my-news"
        role="tab"
        prefetch={true}
        className={`tab ${tab === "my-news" ? "tab-active" : ""} p-0`}
      >
        My News
      </Link>
      <Link
        href="/feed?tab=trending"
        role="tab"
        prefetch={true}
        className={`tab ${tab === "trending" ? "tab-active" : ""} p-0`}
      >
        Trending
      </Link>
      <Link
        href="/feed?tab=search"
        role="tab"
        prefetch={true}
        className={`tab ${tab === "search" ? "tab-active" : ""} p-0`}
      >
        Search
      </Link>
    </div>
  );
}
