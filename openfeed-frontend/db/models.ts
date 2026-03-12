export interface FeedArticleContent {
  type: string;
  base: string;
  value: string | null;
  language: string | null;
}

export interface FeedArticle {
  title: string;
  link: string;
  published: string; // ISO 8601 date string
  summary?: string | null;
  description?: string | null;
  content?: FeedArticleContent[] | null;
}

export interface Feed {
  id: string;
  url: string;
  title: string;
  description: string;
  suggested_category: string;
}

export interface FeedArticleRanked {
  article: FeedArticle;
  score: number;
}
