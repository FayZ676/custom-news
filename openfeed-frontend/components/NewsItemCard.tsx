"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

export type NewsItemCardVariant = "hero" | "featured" | "compact";

interface NewsItemCardProps {
  title: string;
  imageUrl?: string | null;
  summary?: string | null;
  meta?: string;
  isRead?: boolean;
  variant: NewsItemCardVariant;
  onClick: () => void;
}

export function NewsItemCard({
  title,
  imageUrl,
  summary,
  meta,
  isRead = false,
  variant,
  onClick,
}: NewsItemCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const opacityClass = isRead ? "opacity-50" : "";

  if (variant === "hero") {
    return (
      <li
        className={`flex flex-col gap-3 cursor-pointer ${opacityClass}`}
        onClick={onClick}
      >
        <div className="relative aspect-video w-full">
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
            <div className="absolute inset-0 bg-base-200 rounded-sm flex items-center justify-center">
              <ImageOff className="text-base-content/30" size={32} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl sm:text-3xl hover:underline font-bold leading-tight">
            {title}
          </h2>
          {summary && (
            <p className="text-sm sm:text-base text-neutral-500 line-clamp-3">
              {summary}
            </p>
          )}
          {meta && <span className="text-xs text-neutral-500">{meta}</span>}
        </div>
      </li>
    );
  }

  if (variant === "compact") {
    return (
      <li
        className={`grid grid-cols-[1fr_auto] gap-3 cursor-pointer items-center ${opacityClass}`}
        onClick={onClick}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-sm hover:underline leading-snug">{title}</h2>
          {summary && (
            <p className="hidden sm:line-clamp-1 text-xs text-neutral-500">
              {summary}
            </p>
          )}
          {meta && <span className="text-xs text-neutral-500">{meta}</span>}
        </div>
        <div className="relative aspect-square w-14 shrink-0">
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
            <div className="absolute inset-0 bg-base-200 rounded-sm flex items-center justify-center">
              <ImageOff className="text-base-content/30" size={16} />
            </div>
          )}
        </div>
      </li>
    );
  }

  // featured
  return (
    <li
      className={`grid grid-cols-[1fr_2fr] sm:grid-cols-[1fr_3fr] gap-3 sm:gap-6 cursor-pointer items-start ${opacityClass}`}
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
          <div className="absolute inset-0 bg-base-200 rounded-sm flex items-center justify-center">
            <ImageOff className="text-base-content/30" size={24} />
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
          <p className="line-clamp-3 text-sm text-neutral-500">{summary}</p>
        )}
      </div>
    </li>
  );
}
