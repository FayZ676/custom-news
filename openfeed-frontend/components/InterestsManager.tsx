"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

import { UserInterest } from "@/lib/supabase/queries/user_interests";
import {
  addInterestAction,
  removeInterestAction,
} from "@/app/feed/actions";

const MAX_INTERESTS = 7;

interface InterestsManagerProps {
  userId: string;
  initialInterests: UserInterest[];
  onInterestsChange?: () => void;
  // Called after a new interest is persisted. The feed uses this to fetch and
  // store articles for the interest while showing a loading state. When omitted
  // (e.g. onboarding, where ingestion runs once on "Start reading"), adding an
  // interest just updates the list.
  onInterestAdded?: (interestText: string) => void | Promise<void>;
}

async function fetchEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch("/api/search/embedding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text }),
    });
    if (!res.ok) return null;
    const { embedding } = await res.json();
    return Array.isArray(embedding) ? embedding : null;
  } catch {
    return null;
  }
}

export function InterestsManager({
  userId,
  initialInterests,
  onInterestsChange,
  onInterestAdded,
}: InterestsManagerProps) {
  const [interests, setInterests] = useState<UserInterest[]>(initialInterests);
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd =
    inputValue.trim().length > 0 && interests.length < MAX_INTERESTS && !isAdding;

  const handleAdd = async () => {
    const text = inputValue.trim();
    if (!text || interests.length >= MAX_INTERESTS) return;

    setIsAdding(true);
    try {
      const embedding = await fetchEmbedding(text);
      const saved = await addInterestAction(userId, text, embedding);
      setInterests((prev) => [...prev, saved]);
      setInputValue("");
      if (onInterestAdded) {
        // The feed handles its own refresh after ingesting articles for the new
        // interest, so don't also fire onInterestsChange here.
        await onInterestAdded(text);
      } else {
        onInterestsChange?.();
      }
    } finally {
      setIsAdding(false);
      inputRef.current?.focus();
    }
  };

  const handleRemove = async (interestId: string) => {
    setInterests((prev) => prev.filter((i) => i.id !== interestId));
    await removeInterestAction(userId, interestId);
    onInterestsChange?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {interests.map((interest) => (
            <button
              key={interest.id}
              onClick={() => void handleRemove(interest.id)}
              className="btn-soft flex items-center gap-1"
            >
              {interest.interest_text}
              <X size={12} className="opacity-60" />
            </button>
          ))}
        </div>
      )}

      {interests.length < MAX_INTERESTS && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              interests.length === 0
                ? "e.g. AI startups, Formula 1, climate policy..."
                : "Add another interest..."
            }
            disabled={isAdding}
            className="flex-1 rounded-sm bg-base-200 border border-base-300 px-3 h-9.5 text-sm text-base-content placeholder:text-base-content/45 focus:outline-none focus:ring-1 focus:ring-base-content/35 disabled:opacity-50"
          />
          <button
            onClick={() => void handleAdd()}
            disabled={!canAdd}
            className="btn-soft h-9.5 shrink-0"
          >
            {isAdding ? "Adding..." : "Add"}
          </button>
        </div>
      )}

      {interests.length >= MAX_INTERESTS && (
        <p className="text-[11px] text-base-content/40">
          Maximum of {MAX_INTERESTS} interests reached.
        </p>
      )}
    </div>
  );
}
