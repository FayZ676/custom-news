import { ViewFeedSkeleton } from "@/components/ViewFeed";
import { SearchFilterBarSkeleton } from "@/components/SearchFilterBar/SearchFilterBar";

export default function FeedLoading() {
  return (
    <>
      <SearchFilterBarSkeleton />
      <ViewFeedSkeleton />
    </>
  );
}
