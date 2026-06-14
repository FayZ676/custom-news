"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

import { UserInterest } from "@/lib/supabase/queries/user_interests";
import { type NewsQueryPayload } from "@/lib/interests/refine";
import {
  addInterestAction,
  removeInterestAction,
} from "@/app/feed/actions";
import { InterestRefiner } from "@/components/InterestRefiner";

const MAX_INTERESTS = 7;

interface InterestsManagerProps {
  userId: string;
  initialInterests: UserInterest[];
  onInterestAdded?: (interest: UserInterest) => void | Promise<void>;
  onInterestRemoved?: () => void | Promise<void>;
}

export function InterestsManager({
  userId,
  initialInterests,
  onInterestAdded,
  onInterestRemoved,
}: InterestsManagerProps) {
  const [interests, setInterests] = useState<UserInterest[]>(initialInterests);
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [pendingInterest, setPendingInterest] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd =
    inputValue.trim().length > 0 && interests.length < MAX_INTERESTS && !isAdding && !pendingInterest;

  const commitInterest = async (text: string, payload: NewsQueryPayload | null) => {
    setIsAdding(true);
    try {
      const saved = await addInterestAction(userId, text, payload);
      setInterests((prev) => [...prev, saved]);
      setInputValue("");
      await onInterestAdded?.(saved);
    } finally {
      setIsAdding(false);
      setPendingInterest(null);
      inputRef.current?.focus();
    }
  };

  const handleAdd = () => {
    const text = inputValue.trim();
    if (!text || interests.length >= MAX_INTERESTS) return;
    setPendingInterest(text);
    setInputValue("");
  };

  const handleRefinerComplete = (payload: NewsQueryPayload) => {
    if (!pendingInterest) return;
    void commitInterest(pendingInterest, payload);
  };

  const handleRefinerSkip = () => {
    if (!pendingInterest) return;
    void commitInterest(pendingInterest, null);
  };

  const handleRemove = async (interestId: string) => {
    setInterests((prev) => prev.filter((i) => i.id !== interestId));
    await removeInterestAction(userId, interestId);
    await onInterestRemoved?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
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

      {interests.length < MAX_INTERESTS && !pendingInterest && (
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
            onClick={handleAdd}
            disabled={!canAdd}
            className="btn-soft h-9.5 shrink-0"
          >
            {isAdding ? "Adding..." : "Add"}
          </button>
        </div>
      )}

      {pendingInterest && !isAdding && (
        <InterestRefiner
          rawInterest={pendingInterest}
          onComplete={handleRefinerComplete}
          onSkip={handleRefinerSkip}
        />
      )}

      {isAdding && (
        <p className="text-sm text-base-content/50">Adding &ldquo;{pendingInterest}&rdquo;…</p>
      )}

      {interests.length >= MAX_INTERESTS && !pendingInterest && (
        <p className="text-[11px] text-base-content/40">
          Maximum of {MAX_INTERESTS} interests reached.
        </p>
      )}
    </div>
  );
}
