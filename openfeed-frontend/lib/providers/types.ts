import type { FeedArticle } from "@/lib/newsSearch";
import type { NewsQueryPayload } from "@/lib/providers/newsdata";

export interface Provider {
  key: string;
  search(payload: NewsQueryPayload): Promise<FeedArticle[]>;
}

export interface FeedDefinition {
  key: string;
  label: string;
  feedUrl: string;
}
