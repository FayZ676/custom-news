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
    <li className={`cursor-pointer ${opacityClass}`} onClick={onClick}>
      <div
        className={
          hasImage
            ? "grid grid-cols-[112px_1fr] gap-4 items-start sm:grid-cols-[144px_1fr] sm:gap-5"
            : "flex flex-col gap-2"
        }
      >
        {safeImageUrl && (
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-sm">
            {!isLoaded && <div className="skeleton absolute inset-0" />}
            <Image
              src={safeImageUrl}
              alt="Thumbnail"
              fill
              sizes="(min-width: 640px) 144px, 112px"
              loading="lazy"
              className={`object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setIsLoaded(true)}
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h2 className="heading-article hover:underline">{title}</h2>
          {meta && <span className="text-muted">{meta}</span>}
          {summary && (
            <p className="text-body line-clamp-2 sm:line-clamp-3">{summary}</p>
          )}
        </div>
      </div>
    </li>
  );
}
