import type { FeedArticle } from "@/lib/newsSearch";
import type { NewsQueryPayload } from "@/lib/interests/refine";

// A Provider turns the canonical, provider-agnostic interest expression
// (NewsQueryPayload) into articles. NewsData.io implements this by querying its
// search API; curated RSS feeds implement it by fetching the feed and filtering
// locally. Either way the output is the canonical FeedArticle shape, so results
// from every provider merge through the same de-dup.
//
// Note: "provider"/"feed" here is the *source we query*; it is distinct from
// FeedArticle.source_name, which is the publisher of an individual article.
export interface Provider {
  key: string;
  search(payload: NewsQueryPayload): Promise<FeedArticle[]>;
}

// A curated, pre-verified RSS feed exposed to users for subscription.
export interface FeedDefinition {
  key: string;
  label: string;
  feedUrl: string;
}
