"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const hasPrevPage = currentPage > 1;

  return (
    <nav aria-label="Feed pagination" className="py-4">
      <div className="flex items-center justify-center gap-4">
        {hasPrevPage ? (
          isControlled ? (
            <button
              type="button"
              onClick={() => onPageChange?.(currentPage - 1)}
              aria-label="Go to previous page"
              className="btn-secondary"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
          ) : (
            <Link
              href={buildPageHref(currentPage - 1)}
              aria-label="Go to previous page"
              className="btn-secondary"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </Link>
          )
        ) : (
          <button
            disabled
            aria-label="Go to previous page"
            className="btn-secondary"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
        )}

        <span className="text-sm tabular-nums">
          Page {currentPage} of {totalPages}
        </span>

        {hasNextPage ? (
          isControlled ? (
            <button
              type="button"
              onClick={() => onPageChange?.(currentPage + 1)}
              aria-label="Go to next page"
              className="btn-secondary"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <Link
              href={buildPageHref(currentPage + 1)}
              aria-label="Go to next page"
              className="btn-secondary"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          )
        ) : (
          <button
            disabled
            aria-label="Go to next page"
            className="btn-secondary"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </nav>
  );
}

export function FeedPaginationNavSkeleton() {
  return (
    <nav aria-label="Feed pagination loading" aria-busy="true">
      <div className="flex items-center justify-center gap-4">
        <div className="skeleton h-9 w-9 rounded" />
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-9 w-9 rounded" />
      </div>
    </nav>
  );
}
