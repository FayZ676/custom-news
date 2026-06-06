import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/lib/supabase/supabase.types";
import { getShareLinkByToken } from "@/lib/supabase/queries/global_share_links";
import { getStoryById } from "@/lib/supabase/queries/global_stories";

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const resolveSharedStory = async (
  token: string,
): Promise<Tables<"global_stories"> | null> => {
  const supabase = await createClient();
  const shareLink = await getShareLinkByToken(supabase, token);

  if (!shareLink || shareLink.content_type !== "story") return null;

  return getStoryById(supabase, shareLink.content_id);
};

function StoryView({ story }: { story: Tables<"global_stories"> }) {
  return (
    <article className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{story.headline}</h1>

      {story.image_url && (
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={story.image_url}
            alt={story.headline}
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      )}

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

  const story = await resolveSharedStory(token);
  if (!story) return {};

  const title = story.headline;
  const description = story.summary ?? "Shared via The Latest Times";
  const imageUrl = story.image_url;

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

  const story = await resolveSharedStory(token);
  if (!story) notFound();

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
        <StoryView story={story} />
      </section>

      <p className="text-sm text-base-content/60 text-center">
        <Link href="/auth/signin" className="underline font-semibold">
          Visit The Latest Times
        </Link>
      </p>
    </main>
  );
}
