"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import TagInput from "./TagInput";

interface SentenceQueryBuilderProps {
  title?: string;
  subtitle?: string;
  initialName?: string;
  initialAll?: string[];
  initialAny?: string[];
  onSave: (name: string, all: string[], any: string[]) => void | Promise<void>;
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
  onSave,
  onBack,
  onDelete,
  isSaving = false,
}: SentenceQueryBuilderProps) {
  const [name, setName] = useState(initialName);
  const [allTerms, setAllTerms] = useState<string[]>(initialAll);
  const [anyTerms, setAnyTerms] = useState<string[]>(initialAny);

  const canSave =
    name.trim().length > 0 &&
    (allTerms.length > 0 || anyTerms.length > 0) &&
    !isSaving;

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
          <button
            onClick={() => {
              if (canSave)
                void onSave(name.trim(), allTerms, anyTerms);
            }}
            disabled={!canSave}
            className="btn-primary"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
