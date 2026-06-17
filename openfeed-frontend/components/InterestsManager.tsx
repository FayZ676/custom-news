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
  const inputRef = useRef<HTMLInputElement>(null);

  const canAdd =
    inputValue.trim().length > 0 && interests.length < MAX_INTERESTS && !isAdding;

  const handleAdd = async () => {
    const text = inputValue.trim();
    if (!text || interests.length >= MAX_INTERESTS) return;
    setIsAdding(true);
    setInputValue("");
    try {
      const saved = await addInterestAction(userId, text);
      setInterests((prev) => [...prev, saved]);
      await onInterestAdded?.(saved);
    } finally {
      setIsAdding(false);
      inputRef.current?.focus();
    }
  };

  const handleRemove = async (interestId: string) => {
    setInterests((prev) => prev.filter((i) => i.id !== interestId));
    await removeInterestAction(userId, interestId);
    await onInterestRemoved?.();
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
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <button
              key={interest.id}
              onClick={() => void handleRemove(interest.id)}
              className="btn-soft flex items-center gap-1"
            >
              {interest.interest_text}
              <X size={12} className="text-base-content-3" />
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
            className="input-field flex-1"
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
        <p className="text-[11px] text-base-content-4">
          Maximum of {MAX_INTERESTS} interests reached.
        </p>
      )}
    </div>
  );
}
