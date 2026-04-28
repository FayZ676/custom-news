import { createClient } from "@/lib/supabase/server";
import { getStories } from "@/lib/supabase/queries/global_stories";
import { getGlobalFeeds } from "@/lib/supabase/queries/global_feeds";
import { LandingPage } from "@/components/LandingPage";

export default async function Home() {
  const supabase = await createClient();
  const [stories, feeds] = await Promise.all([
    getStories(supabase),
    getGlobalFeeds(supabase),
  ]);

  return <LandingPage stories={stories} feeds={feeds} />;
}
