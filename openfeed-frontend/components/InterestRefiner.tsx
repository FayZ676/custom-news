"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";

import {
  synthesizeQueryPayload,
  type NewsQueryPayload,
  type RefineAnswer,
  type RefinementQuestion,
} from "@/lib/interests/refine";

interface InterestRefinerProps {
  rawInterest: string;
  onComplete: (payload: NewsQueryPayload) => void;
  onSkip: () => void;
}

type State =
  | { phase: "loading" }
  | { phase: "question"; question: RefinementQuestion }
  | { phase: "done" };

export function InterestRefiner({
  rawInterest,
  onComplete,
  onSkip,
}: InterestRefinerProps) {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [history, setHistory] = useState<RefineAnswer[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchNext = useCallback(
    async (nextHistory: RefineAnswer[]) => {
      setState({ phase: "loading" });
      try {
        const res = await fetch("/api/interests/refine/next", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interest: rawInterest, history: nextHistory }),
        });
        if (!res.ok) throw new Error("fetch failed");
        const result = await res.json();
        if (result.done || !result.question) {
          setState({ phase: "done" });
          onComplete(synthesizeQueryPayload(rawInterest, nextHistory));
        } else {
          setState({ phase: "question", question: result.question });
          setSelectedIds([]);
        }
      } catch {
        onComplete(synthesizeQueryPayload(rawInterest, nextHistory));
      }
    },
    [rawInterest, onComplete],
  );

  useEffect(() => {
    void fetchNext([]);
  }, [fetchNext]);

  const handleSkip = () => {
    onSkip();
  };

  const toggleOption = (id: string, multiSelect: boolean) => {
    setSelectedIds((prev) => {
      if (!multiSelect) return prev.includes(id) ? [] : [id];
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const handleNext = () => {
    if (state.phase !== "question") return;
    const nextHistory = [
      ...history,
      { question: state.question, selectedOptionIds: selectedIds },
    ];
    setHistory(nextHistory);
    void fetchNext(nextHistory);
  };

  const handleBack = () => {
    if (history.length === 0) {
      onSkip();
      return;
    }
    const prevHistory = history.slice(0, -1);
    setHistory(prevHistory);
    void fetchNext(prevHistory);
  };

  const questionNumber = history.length + 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-base-content/60">
          Refining &ldquo;{rawInterest}&rdquo;
          {state.phase === "question" && (
            <span className="ml-1 text-base-content/40">
              · question {questionNumber}
            </span>
          )}
        </span>
        <button
          onClick={handleSkip}
          className="btn-text text-xs text-base-content/50 hover:text-base-content/80"
        >
          Skip
        </button>
      </div>

      {state.phase === "loading" && (
        <div className="flex items-center gap-2 text-sm text-base-content/50 py-2">
          <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-base-content/30 border-t-base-content/70 animate-spin" />
          Thinking…
        </div>
      )}

      {state.phase === "question" && (
        <>
          <p className="text-sm font-medium leading-snug">
            {state.question.prompt}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {state.question.options.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id, state.question.multiSelect)}
                  className={`btn-soft flex items-center gap-1 transition-colors ${isSelected ? "ring-1 ring-base-content/40 bg-base-content/10" : ""}`}
                >
                  {isSelected && <Check size={11} className="opacity-70 shrink-0" />}
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={handleBack} className="btn-soft text-sm">
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={selectedIds.length === 0}
              className="btn-primary text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
