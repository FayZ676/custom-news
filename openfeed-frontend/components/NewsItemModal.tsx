"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Copy, ClipboardCheck, Info } from "lucide-react";

import Modal from "@/components/Modal";
import { useShareLink } from "@/components/ShareLinkContext";

import { timeAgo, toTitleCase } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

export type NewsItemArticle = {
  type: "article";
  id: string;
  title: string;
  summary?: string | null;
  url: string;
  feedTitle?: string | null;
  publishedAt?: string | null;
  imageUrl?: string | null;
};

export type NewsItemStory = {
  type: "story";
  id: string;
  headline: string;
  summary?: string | null;
  articleUrls: string[];
  imageUrl?: string | null;
  topicNames?: string[];
};

export type NewsItem = NewsItemArticle | NewsItemStory;

export interface NewsItemModalHandle {
  open: (item: NewsItem) => void;
}

interface NewsItemModalProps {
  onClose?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function copyText(text: string): Promise<boolean> {
  if (!navigator?.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export const NewsItemModal = forwardRef<
  NewsItemModalHandle,
  NewsItemModalProps
>(({ onClose }, ref) => {
  const handleCreateShareLink = useShareLink();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "loading" | "copied">(
    "idle",
  );
  const [showTopics, setShowTopics] = useState(false);

  async function prepareShareUrl(item: NewsItem) {
    setIsPreparingShare(true);
    try {
      const token = await handleCreateShareLink(item.type, item.id);
      const url = new URL(`/share/${token}`, window.location.origin).toString();
      setShareUrl(url);
    } finally {
      setIsPreparingShare(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    setCopyState("loading");
    const ok = await copyText(shareUrl);
    if (!ok) {
      setCopyState("idle");
      return;
    }
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 2000);
  }

  useImperativeHandle(ref, () => ({
    open(item: NewsItem) {
      setSelectedItem(item);
      setCopyState("idle");
      setShareUrl(null);
      setShowTopics(false);
      dialogRef.current?.showModal();
      void prepareShareUrl(item);
    },
  }));

  return (
    <Modal ref={dialogRef} onClose={onClose}>
      {selectedItem && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-semibold pr-6">
            {selectedItem.type === "story"
              ? selectedItem.headline
              : toTitleCase(selectedItem.title)}
          </h3>

          {selectedItem.type === "article" &&
            (selectedItem.feedTitle || selectedItem.publishedAt) && (
              <p className="text-sm text-neutral-500">
                {selectedItem.feedTitle}
                {selectedItem.feedTitle && selectedItem.publishedAt && " · "}
                {selectedItem.publishedAt && timeAgo(selectedItem.publishedAt)}
              </p>
            )}

          {selectedItem.imageUrl && (
            <div className="relative w-full aspect-video">
              <Image
                src={selectedItem.imageUrl}
                alt="Article image"
                fill
                className="object-cover"
              />
            </div>
          )}

          {selectedItem.summary && (
            <p className="text-base leading-relaxed">{selectedItem.summary}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {selectedItem.type === "story" &&
              selectedItem.articleUrls.length > 0 &&
              selectedItem.articleUrls.map((url, i) => (
                <Link
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline"
                >
                  Article {i + 1}
                </Link>
              ))}

            {selectedItem.type === "article" && (
              <a
                href={selectedItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
              >
                Read full article →
              </a>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
            <div />

            <div className="flex items-center gap-1">
              {selectedItem.type === "story" &&
                selectedItem.topicNames &&
                selectedItem.topicNames.length > 0 && (
                  <button
                    onClick={() => setShowTopics((v) => !v)}
                    title="Show topics"
                    className={`p-1.5 cursor-pointer transition-colors ${
                      showTopics
                        ? "text-base-content"
                        : "text-base-content/60 hover:text-base-content"
                    }`}
                    aria-label="Show topics"
                  >
                    <Info size={18} />
                  </button>
                )}

              <button
                className="p-1.5 disabled:opacity-50 cursor-pointer text-base-content/60 hover:text-base-content transition-colors"
                onClick={handleCopy}
                disabled={copyState !== "idle" || isPreparingShare || !shareUrl}
                aria-label={
                  copyState === "copied"
                    ? "Copied to clipboard"
                    : "Copy share link"
                }
              >
                {copyState === "copied" ? (
                  <ClipboardCheck size={18} className="text-success" />
                ) : (
                  <Copy size={18} />
                )}
              </button>
            </div>
          </div>

          {showTopics &&
            selectedItem.type === "story" &&
            selectedItem.topicNames &&
            selectedItem.topicNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedItem.topicNames.map((name) => (
                  <span
                    key={name}
                    className="px-2 py-0.5 rounded-full text-xs bg-base-200 text-base-content/70"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
        </div>
      )}
    </Modal>
  );
});

NewsItemModal.displayName = "NewsItemModal";
