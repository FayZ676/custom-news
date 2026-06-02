import Link from "next/link";

interface FeedPaginationNavProps {
  currentPage: number;
  hasNextPage: boolean;
}

export function FeedPaginationNav({
  currentPage,
  hasNextPage,
}: FeedPaginationNavProps) {
  const prevHref =
    currentPage === 2 ? "/feed" : `/feed?page=${currentPage - 1}`;
  const nextHref = `/feed?page=${currentPage + 1}`;

  return (
    <nav aria-label="Feed pagination" className="mt-8">
      <div className="grid grid-cols-3 items-center text-sm">
        <div className="justify-self-start">
          {currentPage > 1 && (
            <Link href={prevHref} className="hover:underline hover:font-bold">
              Prev
            </Link>
          )}
        </div>

        <div className="justify-self-center text-neutral-500 italic">
          Page {currentPage}
        </div>

        <div className="justify-self-end">
          {hasNextPage && (
            <Link href={nextHref} className="hover:underline hover:font-bold">
              Next
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export function FeedPaginationNavSkeleton() {
  return (
    <nav aria-label="Feed pagination loading" className="mt-8" aria-busy="true">
      <div className="grid grid-cols-3 items-center text-sm">
        <div className="justify-self-start">
          <div className="skeleton h-4 w-10 rounded" />
        </div>

        <div className="justify-self-center">
          <div className="skeleton h-4 w-16 rounded" />
        </div>

        <div className="justify-self-end">
          <div className="skeleton h-4 w-10 rounded" />
        </div>
      </div>
    </nav>
  );
}
