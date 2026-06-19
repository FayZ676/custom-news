"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface NewsItemCardProps {
  title: string;
  imageUrl?: string | null;
  summary?: string | null;
  meta?: string;
  isRead?: boolean;
  isNew?: boolean;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  onImageError?: () => void;
}

export function NewsItemCard({
  title,
  imageUrl,
  summary,
  meta,
  isRead = false,
  isNew = false,
  href,
  external = false,
  onClick,
  onImageError,
}: NewsItemCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const safeImageUrl = imageUrl?.startsWith("https://") ? imageUrl : null;
  const hasImage = Boolean(safeImageUrl) && !imageError;

  const opacityClass = isRead ? "opacity-50" : "";

  const metaRow = (meta || isNew) && (
    <div className="flex items-center gap-2">
      {isNew && (
        <span className="badge badge-accent badge-sm shrink-0 font-medium border-(--color-accent-border)">
          New
        </span>
      )}
      {meta && <span className="text-muted truncate">{meta}</span>}
    </div>
  );

  const content = (
    <>
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
              onError={() => {
                setImageError(true);
                onImageError?.();
              }}
            />
          </div>
          {(meta || summary || isNew) && (
            <div className="flex flex-col gap-1">
              {metaRow}
              {summary && <p className="text-body line-clamp-4">{summary}</p>}
            </div>
          )}
        </div>
      ) : (
        (meta || summary || isNew) && (
          <div className="mt-2 flex flex-col gap-1">
            {metaRow}
            {summary && <p className="text-body line-clamp-4">{summary}</p>}
          </div>
        )
      )}
    </>
  );

  const className = `block cursor-pointer py-4 border-b border-base-300 ${opacityClass}`;

  if (href && external) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {content}
        </a>
      </li>
    );
  }

  if (href) {
    return (
      <li>
        <Link href={href} prefetch className={className}>
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li className={className} onClick={onClick}>
      {content}
    </li>
  );
}

export function NewsItemCardSkeleton() {
  return (
    <li className="py-4 border-b border-base-300">
      <div className="flex flex-col gap-1.5">
        <div className="skeleton h-5 w-full rounded" />
        <div className="skeleton h-5 w-2/3 rounded" />
      </div>
      <div className="mt-3 grid grid-cols-[108px_1fr] gap-4 items-start">
        <div className="skeleton aspect-square rounded-sm" />
        <div className="flex flex-col gap-2">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="flex flex-col gap-1.5">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
          </div>
        </div>
      </div>
    </li>
  );
}
