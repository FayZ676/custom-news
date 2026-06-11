"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

interface FeedPaginationNavProps {
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

const buildPageHref = (page: number): string =>
  page <= 1 ? "/feed" : `/feed?page=${page}`;

export function FeedPaginationNav({
  currentPage,
  hasNextPage,
  totalPages,
  onPageChange,
}: FeedPaginationNavProps) {
  const isControlled = Boolean(onPageChange);
  const numberStripRef = useRef<HTMLDivElement>(null);
  const prevHref = buildPageHref(currentPage - 1);
  const nextHref = buildPageHref(currentPage + 1);
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  useEffect(() => {
    const strip = numberStripRef.current;
    if (!strip) return;

    const activePage = strip.querySelector<HTMLElement>(
      '[data-page-active="true"]',
    );
    if (!activePage) return;

    activePage.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "auto",
    });
  }, [currentPage, totalPages]);

  return (
    <nav
      aria-label="Feed pagination"
      className="mt-8 border-t border-base-300 pt-5"
    >
      <div className="flex items-center justify-center gap-2">
        {currentPage > 1 ? (
          isControlled ? (
            <button
              type="button"
              onClick={() => onPageChange?.(currentPage - 1)}
              aria-label="Go to previous page"
              className="btn-secondary"
            >
              <span aria-hidden="true">&larr;</span>
            </button>
          ) : (
            <Link
              href={prevHref}
              aria-label="Go to previous page"
              className="btn-secondary"
            >
              <span aria-hidden="true">&larr;</span>
            </Link>
          )
        ) : (
          <button disabled aria-label="Go to previous page" className="btn-secondary">
            <span aria-hidden="true">&larr;</span>
          </button>
        )}

        <div
          ref={numberStripRef}
          className="max-w-[60vw] overflow-x-auto overscroll-x-contain pb-1"
        >
          <div className="flex items-center gap-1.5 min-w-max">
            {pages.map((pageNumber) => {
              const isCurrent = pageNumber === currentPage;

              return isControlled ? (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => onPageChange?.(pageNumber)}
                  data-active={isCurrent ? "true" : undefined}
                  aria-current={isCurrent ? "page" : undefined}
                  aria-label={`Go to page ${pageNumber}`}
                  className="btn-secondary"
                >
                  {pageNumber}
                </button>
              ) : (
                <Link
                  key={pageNumber}
                  href={buildPageHref(pageNumber)}
                  data-active={isCurrent ? "true" : undefined}
                  aria-current={isCurrent ? "page" : undefined}
                  aria-label={`Go to page ${pageNumber}`}
                  className="btn-secondary"
                >
                  {pageNumber}
                </Link>
              );
            })}
          </div>
        </div>

        {hasNextPage ? (
          isControlled ? (
            <button
              type="button"
              onClick={() => onPageChange?.(currentPage + 1)}
              aria-label="Go to next page"
              className="btn-secondary"
            >
              <span aria-hidden="true">&rarr;</span>
            </button>
          ) : (
            <Link
              href={nextHref}
              aria-label="Go to next page"
              className="btn-secondary"
            >
              <span aria-hidden="true">&rarr;</span>
            </Link>
          )
        ) : (
          <button disabled aria-label="Go to next page" className="btn-secondary">
            <span aria-hidden="true">&rarr;</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export function FeedPaginationNavSkeleton() {
  return (
    <nav aria-label="Feed pagination loading" className="mt-8" aria-busy="true">
      <div className="flex items-center justify-center gap-2">
        <div className="skeleton h-9 w-9 rounded" />
        <div className="flex items-center gap-1.5">
          <div className="skeleton h-9 w-9 rounded" />
          <div className="skeleton h-9 w-9 rounded" />
          <div className="skeleton h-9 w-9 rounded" />
          <div className="skeleton h-9 w-9 rounded" />
          <div className="skeleton h-9 w-9 rounded" />
        </div>
        <div className="skeleton h-9 w-9 rounded" />
      </div>
    </nav>
  );
}
