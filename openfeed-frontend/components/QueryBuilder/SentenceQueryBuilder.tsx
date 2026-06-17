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
      className="input-field flex flex-wrap gap-1.5 min-h-10.5 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-base-200 text-sm font-medium"
        >
          {tag}
          <button
            onClick={(e) => { e.stopPropagation(); onChange(tags.filter((t) => t !== tag)); }}
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
  initialName?: string;
  initialAll?: string[];
  initialAny?: string[];
  initialSources?: string[];
  availableSources?: SourceOption[];
  onSave: (name: string, all: string[], any: string[], sources: string[]) => void | Promise<void>;
  onBack: () => void;
  onDelete?: () => void | Promise<void>;
  isSaving?: boolean;
}

export default function SentenceQueryBuilder({
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
  const [selectedSources, setSelectedSources] = useState<string[]>(initialSources);

  const toggleSource = (key: string) =>
    setSelectedSources((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const canSave =
    name.trim().length > 0 && (allTerms.length > 0 || anyTerms.length > 0) && !isSaving;

  return (
    <div className="min-h-screen bg-base-100">
      <div className="px-6 py-4 border-b border-base-300">
        <button onClick={onBack} className="btn-text no-underline">
          ← Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <label className="text-muted uppercase tracking-widest font-bold text-xs">
            Query name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gaming Hardware"
            className="input-field max-w-xs"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-muted uppercase tracking-widest font-bold text-xs">
            All keywords
          </label>
          <p className="text-muted text-sm m-0">Articles must mention every one of these.</p>
          <TagInput
            tags={allTerms}
            onChange={setAllTerms}
            placeholder="Type a keyword and press Enter or comma…"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-muted uppercase tracking-widest font-bold text-xs">
            Any keywords
          </label>
          <p className="text-muted text-sm m-0">Articles must mention at least one of these.</p>
          <TagInput
            tags={anyTerms}
            onChange={setAnyTerms}
            placeholder="Type a keyword and press Enter or comma…"
          />
        </div>

        {availableSources && availableSources.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="text-muted uppercase tracking-widest font-bold text-xs">
              Sources
            </label>
            <p className="text-muted text-sm m-0">Leave all unselected to search everywhere.</p>
            <div className="flex flex-wrap gap-2">
              {availableSources.map((source) => (
                <button
                  key={source.key}
                  data-active={selectedSources.includes(source.key) ? "true" : "false"}
                  onClick={() => toggleSource(source.key)}
                  className="btn-soft"
                >
                  {source.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-base-300 pt-5 flex items-center justify-between gap-3">
          <div>
            {onDelete && (
              <button
                onClick={() => void onDelete()}
                className="btn-text text-error hover:text-error"
              >
                Delete query
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className="btn-soft">
              Discard
            </button>
            <button
              onClick={() => {
                if (canSave) void onSave(name.trim(), allTerms, anyTerms, selectedSources);
              }}
              disabled={!canSave}
              className="btn-primary"
            >
              {isSaving ? "Saving…" : "Save query"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
