import { createAnonClient } from "@/lib/supabase/anon";
import { cacheLife } from "next/cache";
import { getStories } from "@/lib/supabase/queries/global_stories";
import { getGlobalFeeds } from "@/lib/supabase/queries/global_feeds";
import { LandingPage } from "@/components/LandingPage";

export default function Home() {
  return <LandingPageContent />;
}

async function LandingPageContent() {
  "use cache";
  cacheLife("hours");

  const supabase = createAnonClient();
  const [stories, feeds] = await Promise.all([
    getStories(supabase),
    getGlobalFeeds(supabase),
  ]);

  return <LandingPage stories={stories} feeds={feeds} />;
}
