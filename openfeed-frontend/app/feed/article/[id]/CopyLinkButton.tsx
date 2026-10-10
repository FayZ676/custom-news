"use client";

import { useEffect, useState } from "react";
import { Link, Check } from "lucide-react";

interface CopyLinkButtonProps {
  articleId: string;
  createShareLink: (contentType: "article", contentId: string) => Promise<string>;
}

export function CopyLinkButton({ articleId, createShareLink }: CopyLinkButtonProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "loading" | "copied">("idle");

  useEffect(() => {
    createShareLink("article", articleId).then((token) => {
      setShareUrl(new URL(`/share/${token}`, window.location.origin).toString());
    });
  }, [articleId, createShareLink]);

  async function handleCopy() {
    if (!shareUrl) return;
    setCopyState("loading");
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("idle");
    }
  }

  return (
    <button
      className="btn-soft"
      onClick={handleCopy}
      disabled={copyState !== "idle" || !shareUrl}
      aria-label={copyState === "copied" ? "Copied to clipboard" : "Copy share link"}
    >
      {copyState === "copied" ? (
        <Check size={18} className="text-success" />
      ) : (
        <Link size={18} />
      )}
    </button>
  );
}
