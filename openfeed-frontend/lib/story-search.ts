import { SupabaseClient } from "@supabase/supabase-js";

import { embedTexts } from "@/lib/embeddings";
import { getGlobalSettings } from "@/lib/supabase/queries/global_settings";
import { matchStoriesByEmbedding } from "@/lib/supabase/queries/match_stories";
import { Database } from "@/lib/supabase/supabase.types";

export interface StorySearchMatch {
  id: string;
  similarity: number;
}

export interface SearchStoriesResult<TStory extends { id: string }> {
  matches: StorySearchMatch[];
  stories: Array<TStory & { final_score: number }>;
}

interface SearchStoriesParams<TStory extends { id: string }> {
  supabase: SupabaseClient<Database>;
  query: string;
  loadStoriesByIds: (ids: string[]) => Promise<TStory[]>;
}

export async function searchStories<TStory extends { id: string }>({
  supabase,
  query,
  loadStoriesByIds,
}: SearchStoriesParams<TStory>): Promise<SearchStoriesResult<TStory>> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { matches: [], stories: [] };
  }

  const settings = await getGlobalSettings(supabase);
  const { embeddings } = await embedTexts([trimmedQuery]);
  const matches = await matchStoriesByEmbedding(
    supabase,
    embeddings[0],
    trimmedQuery,
    settings.max_match_count,
    settings.min_similarity_threshold,
  );

  if (matches.length === 0) {
    return { matches, stories: [] };
  }

  const stories = await loadStoriesByIds(matches.map((match) => match.id));
  if (stories.length === 0) {
    return { matches, stories: [] };
  }

  const storyById = new Map(stories.map((story) => [story.id, story]));

  return {
    matches,
    stories: matches
      .map((match) => {
        const story = storyById.get(match.id);
        if (!story) return null;

        return {
          ...story,
          final_score: match.similarity,
        };
      })
      .filter((story): story is TStory & { final_score: number } =>
        Boolean(story),
      ),
  };
}
