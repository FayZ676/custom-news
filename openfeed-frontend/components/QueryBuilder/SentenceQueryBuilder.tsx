"use client";

import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";

import TagInput from "./TagInput";

interface SourceOption {
  key: string;
  label: string;
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
  const [additionalOptionsOpen, setAdditionalOptionsOpen] = useState(
    initialSources.length > 0,
  );

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
        {onBack && (
          <button
            onClick={onBack}
            disabled={isSaving}
            className="flex items-center gap-2 text-muted hover:text-base-content transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Back to feed</span>
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

          {availableSources && availableSources.length > 0 && (
            <div className="flex flex-col border-b border-base-300">
              <button
                onClick={() => setAdditionalOptionsOpen((open) => !open)}
                className="flex items-center justify-between py-4 text-left"
              >
                <span className="text-base-content font-semibold text-sm">
                  Additional options
                </span>
                <ChevronDown
                  size={16}
                  className={`text-muted transition-transform ${
                    additionalOptionsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {additionalOptionsOpen && (
                <div className="flex flex-col gap-2 pb-4">
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
                          selectedSources.includes(source.key)
                            ? "true"
                            : "false"
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
