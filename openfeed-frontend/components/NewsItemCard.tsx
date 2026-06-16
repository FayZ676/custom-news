"use client";

import Image from "next/image";
import { useState } from "react";

interface NewsItemCardProps {
  title: string;
  imageUrl?: string | null;
  summary?: string | null;
  meta?: string;
  isRead?: boolean;
  onClick: () => void;
  onImageError?: () => void;
}

export function NewsItemCard({
  title,
  imageUrl,
  summary,
  meta,
  isRead = false,
  onClick,
  onImageError,
}: NewsItemCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const safeImageUrl = imageUrl?.startsWith("https://") ? imageUrl : null;
  const hasImage = Boolean(safeImageUrl) && !imageError;

  const opacityClass = isRead ? "opacity-50" : "";

  return (
    <li
      className={`cursor-pointer py-4 border-b border-base-300 ${opacityClass}`}
      onClick={onClick}
    >
      <h2 className="heading-article line-clamp-2 hover:underline">{title}</h2>
      {hasImage ? (
        <div className="mt-3 grid grid-cols-[108px_1fr] gap-4 items-start">
          <div className="relative aspect-square overflow-hidden rounded-sm">
            {!isLoaded && <div className="skeleton absolute inset-0" />}
            <Image
              src={safeImageUrl!}
              alt="Thumbnail"
              fill
              sizes="108px"
              loading="lazy"
              className={`object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setIsLoaded(true)}
              onError={() => { setImageError(true); onImageError?.(); }}
            />
          </div>
          {(meta || summary) && (
            <div className="flex flex-col gap-1">
              {meta && <span className="text-muted">{meta}</span>}
              {summary && <p className="text-body line-clamp-4">{summary}</p>}
            </div>
          )}
        </div>
      ) : (
        (meta || summary) && (
          <div className="mt-2 flex flex-col gap-1">
            {meta && <span className="text-muted">{meta}</span>}
            {summary && <p className="text-body line-clamp-4">{summary}</p>}
          </div>
        )
      )}
    </li>
  );
}
