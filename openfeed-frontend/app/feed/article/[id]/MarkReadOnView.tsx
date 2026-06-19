"use client";

import { useEffect } from "react";

import { markArticleReadAction } from "@/app/feed/actions";

export function MarkReadOnView({ articleId }: { articleId: string }) {
  useEffect(() => {
    void markArticleReadAction(articleId);
  }, [articleId]);

  return null;
}
