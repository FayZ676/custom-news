import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  getSharedArticle,
  SharedArticle,
} from "@/lib/supabase/queries/user_articles";
import { timeAgo, toTitleCase } from "@/lib/utils";

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const resolveSharedArticle = async (
  token: string,
): Promise<SharedArticle | null> => {
  const supabase = await createClient();
  return getSharedArticle(supabase, token);
};

function ArticleView({ article }: { article: SharedArticle }) {
  return (
    <article className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{toTitleCase(article.title)}</h1>

      {(article.source_name || article.published_at) && (
        <p className="text-subtle">
          {article.source_name}
          {article.source_name && article.published_at && " · "}
          {article.published_at && timeAgo(article.published_at)}
        </p>
      )}

      {article.image_url && (
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={article.image_url}
            alt={toTitleCase(article.title)}
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      )}

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;

  if (!isUuid(token)) return {};

  const article = await resolveSharedArticle(token);
  if (!article) return {};

  const title = toTitleCase(article.title);
  const description = article.summary ?? "Shared via The Latest Times";
  const imageUrl = article.image_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(imageUrl && { images: [{ url: imageUrl }] }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <SharePageContent params={params} />
    </Suspense>
  );
}

async function SharePageContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isUuid(token)) notFound();

  const article = await resolveSharedArticle(token);
  if (!article) notFound();

  const logoSrc = "/logo-light.svg";

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
        <ArticleView article={article} />
      </section>

      <p className="text-sm text-base-content/60 text-center">
        <Link href="/auth/signin" className="underline font-semibold">
          Visit The Latest Times
        </Link>
      </p>
    </main>
  );
}
