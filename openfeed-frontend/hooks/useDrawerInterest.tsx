"use client";

import { useState } from "react";
import { DrawerMenuInterest } from "@/components/DrawerMenu";

export function useDrawerInterests(initialInterests: DrawerMenuInterest[]) {
  const [drawerInterests, setDrawerInterests] = useState(initialInterests);

  function addTempInterest(tempId: string, query: string, unreadCount: number) {
    setDrawerInterests((prev) => [
      ...prev,
      {
        interest: { id: tempId, query, unread_articles_count: 0 },
        unreadArticlesCount: unreadCount,
      },
    ]);
  }

  function confirmInterest(
    tempId: string,
    realId: string,
    query: string,
    unreadCount: number,
  ) {
    setDrawerInterests((prev) =>
      prev.map((di) =>
        di.interest.id === tempId
          ? {
              ...di,
              interest: { id: realId, query, unread_articles_count: 0 },
              unreadArticlesCount: unreadCount,
            }
          : di,
      ),
    );
  }

  function removeInterest(interestId: string) {
    setDrawerInterests((prev) =>
      prev.filter((di) => di.interest.id !== interestId),
    );
  }

  function updateUnreadCount(interestId: string, count: number) {
    setDrawerInterests((prev) =>
      prev.map((di) =>
        di.interest.id === interestId
          ? { ...di, unreadArticlesCount: count }
          : di,
      ),
    );
  }

  return {
    drawerInterests,
    addTempInterest,
    confirmInterest,
    removeInterest,
    updateUnreadCount,
  };
}
