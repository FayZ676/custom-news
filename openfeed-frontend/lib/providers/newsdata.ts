import "server-only";

import { fetchLatestNewsArticles } from "@/lib/newsSearch.server";
import { payloadToParams, type NewsQueryPayload } from "@/lib/interests/refine";
import type { Provider } from "@/lib/providers/types";

const API_KEY = process.env.NEWSDATA_API_KEY ?? "";

export const newsDataProvider: Provider = {
  key: "newsdata",
  search(payload: NewsQueryPayload) {
    return fetchLatestNewsArticles(payloadToParams(payload, API_KEY));
  },
};
