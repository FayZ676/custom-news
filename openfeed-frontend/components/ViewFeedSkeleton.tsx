import { NavbarSkeleton } from "@/components/Navbar";
import { SearchbarSkeleton } from "@/components/Searchbar";
import { CardArticleSkeleton } from "@/components/CardArticle";

export function ViewFeedSkeleton({ count = 3 }: { count?: number }) {
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
