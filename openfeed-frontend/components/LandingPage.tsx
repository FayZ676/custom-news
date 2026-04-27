"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, Brain, Filter, ArrowRight } from "lucide-react";

const DEMO_QUERIES = [
  "Latest developments in AI",
  "Climate policy updates",
  "Space exploration news",
  "Cybersecurity threats",
];

const DEMO_RESULTS = {
  "Latest developments in AI": [
    {
      title: "New Language Model Breaks Performance Records",
      source: "TechCrunch",
      description:
        "Researchers unveil breakthrough in natural language processing...",
    },
    {
      title: "AI Safety Conference Announces New Guidelines",
      source: "The Verge",
      description:
        "Industry leaders convene to establish ethical AI practices...",
    },
    {
      title: "Machine Learning Transforms Healthcare Diagnostics",
      source: "MIT Technology Review",
      description:
        "New AI system achieves 95% accuracy in early disease detection...",
    },
  ],
  "Climate policy updates": [
    {
      title: "Global Climate Summit Reaches Historic Agreement",
      source: "Reuters",
      description: "Nations commit to ambitious emissions reduction targets...",
    },
    {
      title: "Renewable Energy Subsidies Expanded in Major Economies",
      source: "Bloomberg",
      description:
        "New policy framework accelerates clean energy transition...",
    },
  ],
  "Space exploration news": [
    {
      title: "Mars Rover Discovers Evidence of Ancient Water",
      source: "NASA",
      description:
        "Latest findings suggest Mars had liquid water for longer than thought...",
    },
    {
      title: "Private Space Company Announces Moon Mission",
      source: "Space.com",
      description: "Commercial lunar expedition planned for next year...",
    },
  ],
  "Cybersecurity threats": [
    {
      title: "New Vulnerability Affects Millions of Devices",
      source: "Wired",
      description:
        "Security researchers discover critical flaw in popular software...",
    },
    {
      title: "Ransomware Attacks Increase 40% Year-Over-Year",
      source: "The Guardian",
      description:
        "Experts warn of evolving cyber threats targeting businesses...",
    },
  ],
};

const resolveLogoSrc = (theme?: string): string =>
  theme === "cupcake" ? "/logo-light.svg" : "/logo-dark.svg";

export function LandingPage() {
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [logoSrc, setLogoSrc] = useState("/logo-light.svg");

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

  const handleQueryClick = (query: string) => {
    setSelectedQuery(null);
    setIsSearching(true);

    setTimeout(() => {
      setSelectedQuery(query);
      setIsSearching(false);
    }, 800);
  };

  const results = selectedQuery
    ? DEMO_RESULTS[selectedQuery as keyof typeof DEMO_RESULTS] || []
    : [];

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-8 pt-8">
        <div className="flex justify-center">
          <Image
            src={logoSrc}
            alt="The Latest Times"
            width={320}
            height={320}
            priority
            style={{ height: "auto" }}
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-center max-w-3xl">
          Your News. Your Interests. Zero Noise.
        </h1>

        <p className="text-xl md:text-2xl text-center max-w-2xl opacity-80">
          Describe what you care about. Get relevant news automatically ranked
          and delivered. That&apos;s it.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-base-content text-base-100 font-bold text-lg hover:opacity-90 transition-opacity text-center"
          >
            Get Started Free
          </Link>
          <Link
            href="/auth/signin"
            className="px-8 py-4 border-2 border-base-content font-bold text-lg hover:bg-base-content hover:text-base-100 transition-colors text-center"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Demo Section */}
      <section className="flex flex-col gap-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          See It In Action
        </h2>
        <p className="text-lg text-center opacity-80 max-w-2xl mx-auto">
          Try one of these sample queries to see how The Latest Times finds what
          matters to you
        </p>

        <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
          {/* Demo Query Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_QUERIES.map((query) => (
              <button
                key={query}
                onClick={() => handleQueryClick(query)}
                className={`px-4 py-3 border-2 text-left font-semibold hover:bg-base-content hover:text-base-100 transition-colors ${
                  selectedQuery === query
                    ? "bg-base-content text-base-100"
                    : "border-base-content"
                }`}
              >
                {query}
              </button>
            ))}
          </div>

          {/* Demo Search Results */}
          {isSearching && (
            <div className="flex flex-col gap-3 animate-pulse">
              <div className="h-24 bg-base-300 rounded" />
              <div className="h-24 bg-base-300 rounded" />
              <div className="h-24 bg-base-300 rounded" />
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="flex flex-col gap-3">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="border-2 border-base-content p-4 hover:bg-base-200 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{result.title}</h3>
                      <p className="text-sm opacity-70 mb-2">
                        {result.description}
                      </p>
                      <span className="text-xs font-semibold">
                        {result.source}
                      </span>
                    </div>
                    <ArrowRight className="shrink-0 opacity-50" size={20} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="flex flex-col gap-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 border-2 border-base-content">
              <Brain size={48} strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold">Describe Your Interests</h3>
            <p className="opacity-80">
              Write what you care about in plain language. &quot;AI
              research&quot;, &quot;climate policy&quot;, &quot;indie
              games&quot; — whatever matters to you.
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 border-2 border-base-content">
              <Filter size={48} strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold">Automatic Ranking</h3>
            <p className="opacity-80">
              Every article from your subscribed sources is automatically ranked
              by relevance. The most important news rises to the top.
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 border-2 border-base-content">
              <Zap size={48} strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold">Stay Updated</h3>
            <p className="opacity-80">
              Your feed updates every hour with fresh articles. No manual
              searching. No endless scrolling. Just relevant news.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="flex flex-col gap-6 bg-base-200 -mx-4 px-4 py-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Why The Latest Times?
        </h2>

        <div className="max-w-3xl mx-auto w-full space-y-6">
          <div className="border-l-4 border-base-content pl-6 py-2">
            <h3 className="text-xl font-bold mb-2">
              No Algorithmic Manipulation
            </h3>
            <p className="opacity-80">
              You define what&apos;s important. Not an algorithm optimizing for
              engagement.
            </p>
          </div>

          <div className="border-l-4 border-base-content pl-6 py-2">
            <h3 className="text-xl font-bold mb-2">No Ads. No Noise.</h3>
            <p className="opacity-80">
              Just the news that matters to you, ranked by relevance. Nothing
              else.
            </p>
          </div>

          <div className="border-l-4 border-base-content pl-6 py-2">
            <h3 className="text-xl font-bold mb-2">Your Time Is Valuable</h3>
            <p className="opacity-80">
              Stop scrolling through hundreds of articles. Get the most relevant
              ones first, automatically.
            </p>
          </div>

          <div className="border-l-4 border-base-content pl-6 py-2">
            <h3 className="text-xl font-bold mb-2">Free to Use</h3>
            <p className="opacity-80">
              Built for readers who want better news. Open source and free to
              self-host.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="flex flex-col items-center gap-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Ready to Take Control of Your News?
        </h2>
        <p className="text-xl text-center opacity-80 max-w-2xl">
          Join readers who&apos;ve stopped scrolling and started reading what
          actually matters.
        </p>
        <Link
          href="/auth/signup"
          className="px-10 py-5 bg-base-content text-base-100 font-bold text-xl hover:opacity-90 transition-opacity"
        >
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm opacity-60 border-t pt-8">
        <p>© 2026 The Latest Times. Open source and built for readers.</p>
      </footer>
    </div>
  );
}
