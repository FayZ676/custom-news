import { NavbarSkeleton } from "@/components/NavbarSkeleton";
import { SearchbarSkeleton } from "@/components/SearchbarSkeleton";
import { CardArticleSkeleton } from "@/components/CardArticleSkeleton";

export function ViewFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col">
      <NavbarSkeleton />
      <SearchbarSkeleton />
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: count }).map((_, i) => (
          <CardArticleSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
