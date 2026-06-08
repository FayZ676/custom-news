import { createAnonClient } from "@/lib/supabase/anon";
import { cacheLife } from "next/cache";
import { getArticles } from "@/lib/supabase/queries/global_articles";
import { getGlobalFeeds } from "@/lib/supabase/queries/global_feeds";
import { LandingPage } from "@/components/LandingPage";

export default function Home() {
  return <LandingPageContent />;
}

async function LandingPageContent() {
  "use cache";
  cacheLife("hours");

  const supabase = createAnonClient();
  const [articles, feeds] = await Promise.all([
    getArticles(supabase),
    getGlobalFeeds(supabase),
  ]);

  return <LandingPage articles={articles} feeds={feeds} />;
}
