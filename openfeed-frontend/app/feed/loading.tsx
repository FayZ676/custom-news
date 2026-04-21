import { BannerSkeleton } from "@/components/Banner";
import { ViewFeedSkeleton } from "@/components/ViewFeed";
import { FooterSkeleton } from "@/components/Footer";

export default function FeedLoading() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <BannerSkeleton />
      <ViewFeedSkeleton />
      <FooterSkeleton />
    </div>
  );
}
