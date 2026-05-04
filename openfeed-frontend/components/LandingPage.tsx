"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, Mail } from "lucide-react";
import { Tables } from "@/lib/supabase/supabase.types";
import { useTickerScroll } from "@/hooks/useTickerScroll";
import { TickerSources } from "./TickerSources";

interface SearchResult {
  title: string;
  summary: string | null;
  feed_title: string;
  url: string;
}

interface LandingPageProps {
  stories: Tables<"global_stories">[];
  feeds: Tables<"global_feeds">[];
}

const resolveLogoSrc = (theme?: string): string =>
  theme === "cupcake" ? "/logo-light.svg" : "/logo-dark.svg";

export function LandingPage({ stories, feeds }: LandingPageProps) {
  const [logoSrc, setLogoSrc] = useState("/logo-light.svg");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { containerRef, innerRef, pause, resume, handleWheel } =
    useTickerScroll();

  useEffect(() => {
    const applyThemeLogo = () =>
      setLogoSrc(resolveLogoSrc(document.documentElement.dataset.theme));
    applyThemeLogo();
    const observer = new MutationObserver(applyThemeLogo);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.results ?? []);
    } finally {
      setIsSearching(false);
    }
  };

  const topStories = [...stories].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 pt-8">
        <Image
          src={logoSrc}
          alt="The Latest Times"
          width={320}
          height={320}
          priority
          style={{ height: "auto" }}
        />
        <p className="text-lg md:text-xl text-center max-w-xl opacity-60 italic tracking-wide">
          All the news fit to read — curated by you.
        </p>
      </section>

      {/* Sources Ticker */}
      <section className="flex flex-col gap-4">
        <h2 className="text-3xl md:text-4xl font-bold">
          Dozens of news feeds in your pocket
        </h2>
        <p className="opacity-70 -mt-2">
          Tracking sources across Technology, Finance &amp; more.
        </p>
        <hr className="border-t-2" />
        <TickerSources feeds={feeds} />
        <hr className="border-t-2" />
      </section>

      {/* Trending Stories */}
      {topStories.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Never miss a breaking news story
          </h2>
          <p className="opacity-70 -mt-2">
            Automatically identified from thousands of articles across all
            sources.
          </p>
          <ol className="flex flex-col divide-y-2 divide-base-content/20">
            {topStories.map((story, i) => (
              <li key={story.id} className="py-4 flex gap-4 items-start">
                <span className="text-4xl font-black opacity-20 leading-none shrink-0 w-8 text-right">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-lg leading-snug">
                    {story.headline}
                  </h3>
                  {story.summary && (
                    <p className="text-sm opacity-70 mt-1 line-clamp-2">
                      {story.summary}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="text-sm opacity-50 italic text-right">
            Stories are refreshed hourly.{" "}
            <Link href="/feed" className="underline hover:opacity-80 transition-opacity">
              View the full feed.
            </Link>
          </p>
        </section>
      )}

      {/* Live Search */}
      <section className="flex flex-col gap-6 max-w-3xl w-full">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Interested in something? Just ask
          </h2>
          <p className="mt-2 opacity-70">
            Ask about anything. Get real articles, ranked by relevance, right
            now.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "AI regulation in Europe"'
            className="flex-1 px-4 py-3 border-2 border-base-content bg-transparent font-medium focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-6 py-3 bg-base-content text-base-100 font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isSearching ? "Searching…" : "Search"}
          </button>
        </form>

        {isSearching && (
          <div className="flex flex-col gap-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-base-300 rounded" />
            ))}
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((result, idx) => (
              <a
                key={idx}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-base-content p-4 hover:bg-base-200 transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{result.title}</h3>
                    {result.summary && (
                      <p className="text-sm opacity-70 mb-2 line-clamp-2">
                        {result.summary}
                      </p>
                    )}
                    <span className="text-xs font-semibold opacity-60">
                      {result.feed_title}
                    </span>
                  </div>
                  <ArrowRight className="shrink-0 opacity-50 mt-1" size={20} />
                </div>
              </a>
            ))}
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <p className="text-center opacity-60 italic">
            No results found. Try a different query.
          </p>
        )}
      </section>

      {/* Email Mockup */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Updates delivered straight to you
          </h2>
          <p className="mt-2 opacity-70 max-w-xl">
            Twice daily — morning and evening — you get a digest of the top
            stories and the latest from your interests. No app required.
          </p>
        </div>
        {/* Email mockup shell */}
        <div className="max-w-2xl mx-auto w-full border-2 border-base-content">
          {/* Email header */}
          <div className="border-b-2 border-base-content px-6 py-4 flex justify-between items-center bg-base-200">
            <div>
              <p className="text-xs opacity-50 uppercase tracking-wider">
                From
              </p>
              <p className="font-semibold">
                The Latest Times &lt;digest@thelatimes.com&gt;
              </p>
            </div>
            <p className="text-xs opacity-50">Mon, Apr 28 · 7:00 AM</p>
          </div>
          {/* Email body */}
          <div className="px-6 py-6 flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-50 mb-2">
                Top Stories
              </p>
              <div className="flex flex-col gap-3">
                {[
                  "Markets rally as Fed signals pause on rate hikes",
                  "New open-source LLM outperforms GPT-4 on key benchmarks",
                  "Global leaders reach landmark climate finance deal",
                ].map((headline, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="font-black opacity-30 text-lg leading-tight shrink-0">
                      {i + 1}.
                    </span>
                    <p className="font-semibold leading-snug">{headline}</p>
                  </div>
                ))}
              </div>
            </div>
            <hr className="border-base-content/20" />
            <div>
              <p className="text-xs uppercase tracking-widest opacity-50 mb-2">
                Your Interests
              </p>
              <div className="flex flex-col gap-4">
                {[
                  {
                    interest: "AI research",
                    title:
                      "Anthropic releases Claude 4 with extended context window",
                    source: "The Verge",
                  },
                  {
                    interest: "Venture capital",
                    title:
                      "Southeast Asian startups attract record VC inflows in Q1",
                    source: "TechCrunch",
                  },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-xs font-semibold opacity-50 uppercase tracking-wide mb-1">
                      {item.interest}
                    </p>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-xs opacity-50 mt-0.5">{item.source}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t-2 border-base-content/20 px-6 py-3 text-xs opacity-40 text-center">
            The Latest Times · Unsubscribe · Manage preferences
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Ready to Read Only What Matters?
        </h2>
        <Link
          href="/feed"
          className="px-10 py-5 bg-base-content text-base-100 font-bold text-xl hover:opacity-90 transition-opacity"
        >
          View Feed
        </Link>
      </section>

      <footer className="text-center text-sm opacity-60 border-t pt-8">
        <p>© 2026 The Latest Times. Open source and built for readers.</p>
      </footer>
    </div>
  );
}
