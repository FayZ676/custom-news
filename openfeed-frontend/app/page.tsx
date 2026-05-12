import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { getStories } from "@/lib/supabase/queries/global_stories";
import { getGlobalFeeds } from "@/lib/supabase/queries/global_feeds";
import { LandingPage } from "@/components/LandingPage";
import { Database } from "@/lib/supabase/supabase.types";

export default function Home() {
  return <LandingPageContent />;
}

async function LandingPageContent() {
  "use cache";
  cacheLife("hours");

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  const [stories, feeds] = await Promise.all([
    getStories(supabase),
    getGlobalFeeds(supabase),
  ]);

  return <LandingPage stories={stories} feeds={feeds} />;
}
