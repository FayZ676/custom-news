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
}

export function NewsItemCard({
  title,
  imageUrl,
  summary,
  meta,
  isRead = false,
  onClick,
}: NewsItemCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const safeImageUrl = imageUrl?.startsWith("https://") ? imageUrl : null;
  const hasImage = Boolean(safeImageUrl);

  const opacityClass = isRead ? "opacity-50" : "";

  return (
    <li
      className={`cursor-pointer py-4 border-b border-base-300 ${opacityClass}`}
      onClick={onClick}
    >
      {hasImage ? (
        <div className="grid grid-cols-[1fr_2fr] gap-3 sm:grid-cols-[144px_1fr] sm:gap-x-5 sm:gap-y-2 sm:items-start">
          <div className="relative aspect-4/3 overflow-hidden rounded-sm sm:row-span-2">
            {!isLoaded && <div className="skeleton absolute inset-0" />}
            <Image
              src={safeImageUrl!}
              alt="Thumbnail"
              fill
              sizes="(min-width: 640px) 144px, 33vw"
              loading="lazy"
              className={`object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setIsLoaded(true)}
            />
          </div>
          <h2 className="heading-article hover:underline">{title}</h2>
          {(meta || summary) && (
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-2">
              {meta && <span className="text-muted">{meta}</span>}
              {summary && (
                <p className="text-body line-clamp-2 sm:line-clamp-3">{summary}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="heading-article hover:underline">{title}</h2>
          {meta && <span className="text-muted">{meta}</span>}
          {summary && (
            <p className="text-body line-clamp-2 sm:line-clamp-3">{summary}</p>
          )}
        </div>
      )}
    </li>
  );
}
