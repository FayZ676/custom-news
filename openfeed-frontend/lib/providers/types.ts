import type { FeedArticle } from "@/lib/newsSearch";
import type { NewsQueryPayload } from "@/lib/interests/refine";

export interface Provider {
  key: string;
  search(payload: NewsQueryPayload): Promise<FeedArticle[]>;
}

export interface FeedDefinition {
  key: string;
  label: string;
  feedUrl: string;
}
