"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Pencil, Check } from "lucide-react";

import {
  type NewsQueryPayload,
  type RefineAnswer,
  type RefinementQuestion,
} from "@/lib/interests/refine";

const MAX_QUESTIONS = 3;

const FALLBACK_PAYLOAD = (interest: string): NewsQueryPayload => ({
  q: interest,
  qInTitle: null,
  category: null,
  country: null,
  timeframe: null,
});

interface MCQFlowProps {
  rawInterest: string;
  onComplete: (payload: NewsQueryPayload) => void;
  onSkip: () => void;
}

// A question the user has reached, together with their (possibly empty) answer.
// `nextKey` records the answer that was used to generate the following step, so
// pure back/forward navigation can reuse cached questions instead of re-calling
// the LLM. It's invalidated when the answer changes.
type Step = {
  question: RefinementQuestion;
  selectedOptionIds: string[];
  freeText: string;
  nextKey: string | null;
};

type Phase = "loading" | "question" | "finalizing";

function answerKey(step: Step): string {
  return JSON.stringify({
    ids: [...step.selectedOptionIds].sort(),
    text: step.freeText.trim(),
  });
}

function toAnswer(step: Step): RefineAnswer {
  const text = step.freeText.trim();
  return {
    question: step.question,
    selectedOptionIds: step.selectedOptionIds,
    ...(text ? { freeText: text } : {}),
  };
}

export function MCQFlow({ rawInterest, onComplete, onSkip }: MCQFlowProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");

  const fetchNextQuestion = useCallback(
    async (history: RefineAnswer[]): Promise<RefinementQuestion | null> => {
      const res = await fetch("/api/interests/refine/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interest: rawInterest, history }),
      });
      if (!res.ok) throw new Error("fetch failed");
      const result = await res.json();
      if (result.done || !result.question) return null;
      return result.question as RefinementQuestion;
    },
    [rawInterest],
  );

  const finalize = useCallback(
    async (history: RefineAnswer[]) => {
      setPhase("finalizing");
      try {
        const res = await fetch("/api/interests/refine/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interest: rawInterest, history }),
        });
        if (!res.ok) throw new Error("fetch failed");
        const { payload } = await res.json();
        onComplete(payload as NewsQueryPayload);
      } catch {
        onComplete(FALLBACK_PAYLOAD(rawInterest));
      }
    },
    [rawInterest, onComplete],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const q = await fetchNextQuestion([]);
        if (cancelled) return;
        if (!q) {
          await finalize([]);
          return;
        }
        setSteps([
          { question: q, selectedOptionIds: [], freeText: "", nextKey: null },
        ]);
        setIndex(0);
        setPhase("question");
      } catch {
        if (!cancelled) onComplete(FALLBACK_PAYLOAD(rawInterest));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchNextQuestion, finalize, rawInterest, onComplete]);

  const updateCurrent = (patch: Partial<Step>) => {
    setSteps((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  // Advance from the current question. `override` carries the just-applied
  // answer when state hasn't flushed yet (e.g. single-select click-to-advance).
  const advance = useCallback(
    async (override?: Step) => {
      const cur = override ?? steps[index];
      if (!cur) return;
      const key = answerKey(cur);

      // Cache hit: the next question already exists and the answer that
      // produced it hasn't changed — just move forward without re-fetching.
      if (index < steps.length - 1 && cur.nextKey === key) {
        setIndex(index + 1);
        return;
      }

      const history = steps
        .slice(0, index + 1)
        .map((s, i) => (i === index ? toAnswer(cur) : toAnswer(s)));

      if (index >= MAX_QUESTIONS - 1) {
        await finalize(history);
        return;
      }

      setPhase("loading");
      try {
        const q = await fetchNextQuestion(history);
        setSteps((prev) => {
          const trimmed = prev.slice(0, index + 1);
          trimmed[index] = { ...cur, nextKey: key };
          if (q) {
            trimmed.push({
              question: q,
              selectedOptionIds: [],
              freeText: "",
              nextKey: null,
            });
          }
          return trimmed;
        });
        if (!q) {
          await finalize(history);
          return;
        }
        setIndex(index + 1);
        setPhase("question");
      } catch {
        onComplete(FALLBACK_PAYLOAD(rawInterest));
      }
    },
    [steps, index, finalize, fetchNextQuestion, rawInterest, onComplete],
  );

  const goBack = () => {
    if (index > 0 && phase === "question") setIndex(index - 1);
  };

  const handleOptionClick = (optId: string) => {
    const cur = steps[index];
    if (!cur) return;
    if (cur.question.multiSelect) {
      const selected = cur.selectedOptionIds.includes(optId)
        ? cur.selectedOptionIds.filter((x) => x !== optId)
        : [...cur.selectedOptionIds, optId];
      updateCurrent({ selectedOptionIds: selected });
    } else {
      void advance({ ...cur, selectedOptionIds: [optId] });
    }
  };

  const cur = steps[index];
  const canAdvance =
    !!cur && (cur.selectedOptionIds.length > 0 || cur.freeText.trim().length > 0);
  const interactive = phase === "question";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-base-300 bg-base-200/40 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-base-content-3">
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0 || !interactive}
            aria-label="Previous question"
            className="cursor-pointer rounded p-0.5 hover:text-base-content disabled:cursor-default disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-subtle select-none">
            {index + 1} of {MAX_QUESTIONS}
          </span>
          <button
            type="button"
            onClick={() => void advance()}
            disabled={!canAdvance || !interactive}
            aria-label="Next question"
            className="cursor-pointer rounded p-0.5 hover:text-base-content disabled:cursor-default disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          type="button"
          onClick={onSkip}
          aria-label="Skip refinement"
          className="cursor-pointer rounded p-0.5 text-base-content-3 hover:text-base-content"
        >
          <X size={18} />
        </button>
      </header>

      {phase === "loading" && (
        <div className="flex items-center gap-2 py-6 text-sm text-base-content-3">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-base-content/30 border-t-base-content/70" />
          Thinking…
        </div>
      )}

      {phase === "finalizing" && (
        <div className="flex items-center gap-2 py-6 text-sm text-base-content-3">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-base-content/30 border-t-base-content/70" />
          Building your feed…
        </div>
      )}

      {phase === "question" && cur && (
        <>
          <h3 className="heading-article">{cur.question.prompt}</h3>

          <div className="flex flex-col">
            {cur.question.options.map((opt, i) => {
              const selected = cur.selectedOptionIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleOptionClick(opt.id)}
                  className="-mx-1 flex items-center gap-3 rounded border-t border-base-300 px-1 py-3 text-left transition-colors first:border-t-0 hover:bg-base-content/5"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                      selected
                        ? "border-base-content bg-base-content text-base-100"
                        : "border-base-300 text-base-content-2"
                    }`}
                  >
                    {selected && cur.question.multiSelect ? (
                      <Check size={13} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="text-sm font-medium text-base-content">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 border-t border-base-300 pt-3">
            <Pencil size={15} className="shrink-0 text-base-content-4" />
            <input
              type="text"
              value={cur.freeText}
              onChange={(e) => updateCurrent({ freeText: e.target.value })}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const value = e.currentTarget.value;
                if (value.trim() || cur.selectedOptionIds.length > 0) {
                  void advance({ ...cur, freeText: value });
                }
              }}
              placeholder="Type your answer..."
              className="flex-1 bg-transparent text-sm text-base-content placeholder:text-base-content-4 focus:outline-none"
            />
          </div>
        </>
      )}
    </div>
  );
}
