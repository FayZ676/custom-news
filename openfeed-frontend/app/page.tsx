import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getStories } from "@/lib/supabase/queries/global_stories";
import { getGlobalFeeds } from "@/lib/supabase/queries/global_feeds";
import { LandingPage } from "@/components/LandingPage";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <LandingPageContent />
    </Suspense>
  );
}

async function LandingPageContent() {
  const supabase = await createClient();
  const [stories, feeds] = await Promise.all([
    getStories(supabase),
    getGlobalFeeds(),
  ]);

  return <LandingPage stories={stories} feeds={feeds} />;
}
