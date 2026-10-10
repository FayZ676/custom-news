"use client";

import { useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";

import { previewInterestAction, type PreviewArticle } from "@/app/feed/actions";
import { timeAgo, toTitleCase } from "@/lib/utils";

interface InterestEditorProps {
  title?: string;
  subtitle?: string;
  initialText?: string;
  onSave: (text: string) => void | Promise<void>;
  onBack?: () => void;
  onDelete?: () => void | Promise<void>;
  isSaving?: boolean;
}

function PreviewList({ articles }: { articles: PreviewArticle[] }) {
  return (
    <ol className="flex flex-col">
      {articles.map((article) => (
        <li key={article.id} className="py-3 border-b border-base-300">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm font-semibold text-base-content hover:underline"
          >
            {toTitleCase(article.title)}
          </a>
          <p className="text-muted mt-1">
            {timeAgo(article.published_at)} · {article.source_name}
          </p>
          <p className="text-body mt-1">{article.reason}</p>
        </li>
      ))}
    </ol>
  );
}

export default function InterestEditor({
  title,
  subtitle,
  initialText = "",
  onSave,
  onBack,
  onDelete,
  isSaving = false,
}: InterestEditorProps) {
  const [text, setText] = useState(initialText);
  const [preview, setPreview] = useState<PreviewArticle[] | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [isPreviewing, startPreview] = useTransition();

  const trimmed = text.trim();
  const isBusy = isSaving || isPreviewing;

  const handlePreview = () => {
    startPreview(async () => {
      setPreviewError(false);
      try {
        setPreview(await previewInterestAction(trimmed));
      } catch {
        setPreviewError(true);
      }
    });
  };

  const shown = preview?.filter((a) => a.relevant) ?? [];
  const filtered = preview?.filter((a) => !a.relevant) ?? [];

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full py-6 px-4">
      {onBack && (
        <button
          onClick={onBack}
          disabled={isSaving}
          className="flex items-center gap-2 text-muted hover:text-base-content transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Back to your news</span>
        </button>
      )}

      {(title || subtitle) && (
        <div className="flex flex-col gap-1 mb-4">
          {title && (
            <h1 className="font-serif text-3xl font-semibold text-base-content">
              {title}
            </h1>
          )}
          {subtitle && <p className="text-muted text-sm">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-base-300 pt-4">
        <span className="text-base-content font-semibold text-sm">
          What do you want to follow?
        </span>
        <p className="text-muted">
          Describe it the way you&apos;d tell a friend, including anything you
          don&apos;t want to see.
        </p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="e.g. Rust being adopted in production systems — not beginner tutorials or crate release notes."
          className="input-field h-auto py-2 resize-y font-serif text-lg"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          {onDelete && (
            <button
              onClick={() => void onDelete()}
              disabled={isBusy}
              className="btn-text text-error hover:text-error"
            >
              Delete
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={!trimmed || isBusy}
            className="btn-soft"
          >
            {isPreviewing ? "Previewing…" : "Preview"}
          </button>
          <button
            onClick={() => void onSave(trimmed)}
            disabled={!trimmed || isBusy}
            className="btn-primary"
          >
            {isSaving ? "Finding articles…" : "Save"}
          </button>
        </div>
      </div>

      {previewError && (
        <p className="text-error text-sm">
          Couldn&apos;t build a preview. Please try again.
        </p>
      )}

      {preview && (
        <div className="flex flex-col gap-6 pt-2">
          <section className="flex flex-col gap-1">
            <span className="heading-modal">
              Would show ({shown.length})
            </span>
            {shown.length === 0 ? (
              <p className="text-subtle italic">
                Nothing from the last few days matches yet.
              </p>
            ) : (
              <PreviewList articles={shown} />
            )}
          </section>

          {filtered.length > 0 && (
            <details className="flex flex-col gap-1">
              <summary className="heading-modal cursor-pointer">
                Filtered out ({filtered.length})
              </summary>
              <PreviewList articles={filtered} />
            </details>
          )}
        </div>
      )}
    </div>
  );
}
