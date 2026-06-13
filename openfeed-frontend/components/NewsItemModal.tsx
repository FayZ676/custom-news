"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Image from "next/image";

import { ArrowUpRight, Clipboard, ClipboardCheck } from "lucide-react";

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
  sourceName?: string | null;
  publishedAt?: string | null;
  imageUrl?: string | null;
  // Live search results are ephemeral and have no persisted id to share.
  shareable?: boolean;
};

export type NewsItem = NewsItemArticle;

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
      dialogRef.current?.showModal();
      if (item.shareable !== false) void prepareShareUrl(item);
    },
  }));

  return (
    <Modal ref={dialogRef} onClose={onClose}>
      {selectedItem && (
        <div className="flex flex-col gap-4">
          <h3 className="heading-modal">
            {toTitleCase(selectedItem.title)}
          </h3>

          {selectedItem.imageUrl && (
            <div className="relative w-full aspect-video rounded-sm overflow-hidden">
              <Image
                src={selectedItem.imageUrl}
                alt="Article image"
                fill
                sizes="(min-width: 1024px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          {(selectedItem.sourceName || selectedItem.publishedAt) && (
            <p className="text-muted">
              {selectedItem.sourceName}
              {selectedItem.sourceName && selectedItem.publishedAt && " · "}
              {selectedItem.publishedAt && timeAgo(selectedItem.publishedAt)}
            </p>
          )}

          {selectedItem.summary && (
            <p className="text-base leading-relaxed">{selectedItem.summary}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <a
              href={selectedItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-soft"
            >
              Read full article <ArrowUpRight size={16} />
            </a>

            {selectedItem.shareable !== false && (
            <button
              className="btn-soft disabled:opacity-50"
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
                <Clipboard size={18} />
              )}
            </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
});

NewsItemModal.displayName = "NewsItemModal";
