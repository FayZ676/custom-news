"use client";

import { useRef, useState } from "react";

interface SourceOption {
  key: string;
  label: string;
}

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}

function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const val = draft.trim().replace(/,+$/, "").trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div
      className="input-field h-auto flex flex-wrap gap-1.5 min-h-10.5 py-2 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-base-200 text-sm font-medium"
        >
          {tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange(tags.filter((t) => t !== tag));
            }}
            aria-label={`Remove ${tag}`}
            className="text-muted hover:text-base-content leading-none"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="border-0 outline-none bg-transparent min-w-30 flex-1 text-sm p-0"
      />
    </div>
  );
}

interface SentenceQueryBuilderProps {
  title?: string;
  subtitle?: string;
  initialName?: string;
  initialAll?: string[];
  initialAny?: string[];
  initialSources?: string[];
  availableSources?: SourceOption[];
  onSave: (
    name: string,
    all: string[],
    any: string[],
    sources: string[],
  ) => void | Promise<void>;
  onBack?: () => void;
  onDelete?: () => void | Promise<void>;
  isSaving?: boolean;
}

export default function SentenceQueryBuilder({
  title,
  subtitle,
  initialName = "",
  initialAll = [],
  initialAny = [],
  initialSources = [],
  availableSources,
  onSave,
  onBack,
  onDelete,
  isSaving = false,
}: SentenceQueryBuilderProps) {
  const [name, setName] = useState(initialName);
  const [allTerms, setAllTerms] = useState<string[]>(initialAll);
  const [anyTerms, setAnyTerms] = useState<string[]>(initialAny);
  const [selectedSources, setSelectedSources] =
    useState<string[]>(initialSources);

  const toggleSource = (key: string) =>
    setSelectedSources((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const canSave =
    name.trim().length > 0 &&
    (allTerms.length > 0 || anyTerms.length > 0) &&
    !isSaving;

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-4">
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

        {/* Name — serif title, like naming a piece */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Query name"
          className="w-full bg-transparent border-0 outline-none font-serif text-2xl font-semibold text-base-content placeholder:text-base-content-4"
        />

        {/* Fields as editorial rows */}
        <div className="flex flex-col border-t border-base-300">
          <div className="flex flex-col gap-2 py-4 border-b border-base-300">
            <div>
              <span className="text-base-content font-semibold text-sm">
                Required words
              </span>
              <p className="text-muted text-xs mt-0.5">
                Every term must appear in matching articles
              </p>
            </div>
            <TagInput
              tags={allTerms}
              onChange={setAllTerms}
              placeholder="Type and press Enter…"
            />
          </div>

          <div className="flex flex-col gap-2 py-4 border-b border-base-300">
            <div>
              <span className="text-base-content font-semibold text-sm">
                Optional words
              </span>
              <p className="text-muted text-xs mt-0.5">
                At least one term must appear in matching articles
              </p>
            </div>
            <TagInput
              tags={anyTerms}
              onChange={setAnyTerms}
              placeholder="Type and press Enter…"
            />
          </div>

          {availableSources && availableSources.length > 0 && (
            <div className="flex flex-col gap-2 py-4 border-b border-base-300">
              <div>
                <span className="text-base-content font-semibold text-sm">
                  Sources
                </span>
                <p className="text-muted text-xs mt-0.5">
                  Limit results to articles from selected sources
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSources.map((source) => (
                  <button
                    key={source.key}
                    data-active={
                      selectedSources.includes(source.key) ? "true" : "false"
                    }
                    onClick={() => toggleSource(source.key)}
                    className="btn-soft"
                  >
                    {source.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            {onDelete && (
              <button
                onClick={() => void onDelete()}
                disabled={isSaving}
                className="btn-text text-error hover:text-error"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {onBack && (
              <button onClick={onBack} disabled={isSaving} className="btn-soft">
                Discard
              </button>
            )}
            <button
              onClick={() => {
                if (canSave)
                  void onSave(name.trim(), allTerms, anyTerms, selectedSources);
              }}
              disabled={!canSave}
              className="btn-primary"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
