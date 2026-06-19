import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserArticleById } from "@/lib/supabase/queries/user_articles";
import { markArticleRead } from "@/lib/supabase/queries/user_article_interactions";
import { createShareLinkAction } from "@/app/feed/actions";
import { timeAgo, toTitleCase } from "@/lib/utils";

import { CopyLinkButton } from "./CopyLinkButton";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await getAuthenticatedUser();
  const supabase = await createClient();
  const article = await getUserArticleById(supabase, userId, id);

  if (!article) notFound();

  // Opening the article marks it read; returning to the feed shows it greyed
  // out and demoted below unread items.
  await markArticleRead(supabase, userId, article.id);

  const handleCreateShareLink = createShareLinkAction.bind(null, userId);

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full py-6 px-4">
      <Link
        href="/feed"
        className="flex items-center gap-2 text-muted hover:text-base-content transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        <span className="text-sm">Back to your news</span>
      </Link>

      <h1 className="heading-article">{toTitleCase(article.title)}</h1>

      {(article.source_name || article.published_at) && (
        <p className="text-muted">
          {article.source_name}
          {article.source_name && article.published_at && " · "}
          {article.published_at && timeAgo(article.published_at)}
        </p>
      )}

      {article.image_url && (
        <div className="relative w-full aspect-video rounded-sm overflow-hidden">
          <Image
            src={article.image_url}
            alt="Article image"
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {article.summary && (
        <p className="text-base text-base-content leading-relaxed">{article.summary}</p>
      )}

      <div className="flex items-center justify-between pt-2">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-soft"
        >
          Read full article <ArrowUpRight size={16} />
        </a>

        <CopyLinkButton
          articleId={article.id}
          createShareLink={handleCreateShareLink}
        />
      </div>
    </div>
  );
}
