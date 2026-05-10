"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

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

  return (
    <li
      className={`grid grid-cols-[1fr_2fr] sm:grid-cols-[1fr_3fr] gap-3 sm:gap-6 cursor-pointer items-start ${isRead ? "opacity-50" : ""}`}
      onClick={onClick}
    >
      <div className="relative aspect-square w-full">
        {imageUrl ? (
          <>
            {!isLoaded && <div className="skeleton absolute inset-0" />}
            <Image
              src={imageUrl}
              alt="Thumbnail"
              fill
              loading="lazy"
              className={`object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setIsLoaded(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-neutral-800 rounded-sm flex items-center justify-center">
            <ImageOff className="text-neutral-600" size={24} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 sm:gap-2">
        <h2 className="text-base sm:text-lg hover:underline font-semibold">
          {title}
          {meta && (
            <>
              {" "}
              &middot;{" "}
              <span className="text-neutral-500 font-normal">{meta}</span>
            </>
          )}
        </h2>
        {summary && (
          <p className="hidden sm:line-clamp-3 text-sm text-neutral-500">
            {summary}
          </p>
        )}
      </div>
    </li>
  );
}
