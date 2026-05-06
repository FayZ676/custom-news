import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/lib/supabase/supabase.types";
import { getShareLinkByToken } from "@/lib/supabase/queries/global_share_links";
import { getGlobalArticleById } from "@/lib/supabase/queries/global_articles";
import { getStoryById } from "@/lib/supabase/queries/global_stories";
import { getUserSettings } from "@/lib/supabase/queries/user_settings";
import { timeAgo, toTitleCase } from "@/lib/utils";

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

type SharedContent =
  | { type: "article"; data: Tables<"global_articles"> }
  | { type: "story"; data: Tables<"global_stories"> };

const resolveSharedContent = async (
  token: string,
): Promise<SharedContent | null> => {
  const supabase = await createClient();
  const shareLink = await getShareLinkByToken(supabase, token);

  if (!shareLink) return null;

  if (shareLink.content_type === "article") {
    const article = await getGlobalArticleById(supabase, shareLink.content_id);
    return article ? { type: "article", data: article } : null;
  }

  if (shareLink.content_type === "story") {
    const story = await getStoryById(supabase, shareLink.content_id);
    return story ? { type: "story", data: story } : null;
  }

  return null;
};

function ArticleView({ article }: { article: Tables<"global_articles"> }) {
  return (
    <article className="flex flex-col gap-4">
      <p className="text-sm uppercase tracking-wide text-base-content/60">
        Shared article
      </p>

      <h1 className="text-2xl font-semibold">{toTitleCase(article.title)}</h1>

      <p className="text-sm text-base-content/70">
        {article.feed_title} &middot; {timeAgo(article.published_at)}
      </p>

      {article.summary && (
        <p className="text-base leading-relaxed">{article.summary}</p>
      )}

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold underline"
      >
        Read full article →
      </a>
    </article>
  );
}

function StoryView({ story }: { story: Tables<"global_stories"> }) {
  return (
    <article className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{story.headline}</h1>

      {story.summary && (
        <p className="text-base leading-relaxed">{story.summary}</p>
      )}

      {story.related_articles_urls.length > 0 && (
        <div className="flex gap-2">
          {story.related_articles_urls.map((url, index) => (
            <Link
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline"
            >
              Article {index + 1}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  if (!isUuid(token)) return {};

  const shared = await resolveSharedContent(token);
  if (!shared) return {};

  const title =
    shared.type === "article"
      ? toTitleCase(shared.data.title)
      : shared.data.headline;

  const description =
    shared.type === "article"
      ? (shared.data.summary ?? "Shared via The Latest Times")
      : (shared.data.summary ?? "Shared via The Latest Times");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isUuid(token)) notFound();

  const shared = await resolveSharedContent(token);
  if (!shared) notFound();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  const colorTheme = claimsData
    ? (await getUserSettings(supabase, claimsData.claims.sub)).color_theme
    : "cupcake";

  const logoSrc =
    colorTheme === "cupcake" ? "/logo-light.svg" : "/logo-dark.svg";

  return (
    <main className="flex flex-col gap-6 w-full max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-center">
        <Link href="/" aria-label="Go to The Latest Times landing page">
          <Image
            src={logoSrc}
            alt="The Latest Times"
            width={240}
            height={240}
            priority
            style={{ height: "auto" }}
          />
        </Link>
      </div>

      <section className="border border-base-300 p-5">
        {shared.type === "article" ? (
          <ArticleView article={shared.data} />
        ) : (
          <StoryView story={shared.data} />
        )}
      </section>

      <p className="text-sm text-base-content/60 text-center">
        <Link href="/auth/signin" className="underline font-semibold">
          Visit The Latest Times
        </Link>
      </p>
    </main>
  );
}
