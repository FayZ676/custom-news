"use client";

import { createContext, useContext } from "react";

type ShareLinkFn = (
  contentType: "article" | "story",
  contentId: string,
) => Promise<string>;

const ShareLinkContext = createContext<ShareLinkFn | null>(null);

export function ShareLinkProvider({
  handleCreateShareLink,
  children,
}: {
  handleCreateShareLink: ShareLinkFn;
  children: React.ReactNode;
}) {
  return (
    <ShareLinkContext value={handleCreateShareLink}>
      {children}
    </ShareLinkContext>
  );
}

export function useShareLink(): ShareLinkFn {
  const ctx = useContext(ShareLinkContext);
  if (!ctx)
    throw new Error("useShareLink must be used within ShareLinkProvider");
  return ctx;
}
