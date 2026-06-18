"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import TagInput from "@/components/QueryBuilder/TagInput";
import { saveQueryAction } from "@/app/feed/actions";

const STEP_COUNT = 3;
const FADE_MS = 200;

export default function OnboardingQueryBuilder({
  userId,
}: {
  userId: string;
}) {
  const router = useRouter();
  // step -1 is the intro/welcome screen; 0–2 are the three wizard steps.
  const [step, setStep] = useState(-1);
  const [visible, setVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [allTerms, setAllTerms] = useState<string[]>([]);
  const [anyTerms, setAnyTerms] = useState<string[]>([]);

  // Fade out, swap screen, fade back in.
  const goToStep = (next: number) => {
    setVisible(false);
    setTimeout(() => {
      setStep(next);
      setVisible(true);
    }, FADE_MS);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await saveQueryAction(userId, name.trim(), allTerms, anyTerms, []);
      router.push("/feed");
    } catch {
      setError("Something went wrong saving your query. Please try again.");
      setIsSaving(false);
    }
  };

  const isIntro = step === -1;
  const isLastStep = step === STEP_COUNT - 1;
  // Lenient per-step gating: only the name and the final save are blocked.
  const canAdvance = step === 0 ? name.trim().length > 0 : true;
  const canFinish =
    name.trim().length > 0 && (allTerms.length > 0 || anyTerms.length > 0);

  const handleNext = () => {
    if (isLastStep) {
      if (canFinish && !isSaving) void handleSave();
    } else if (canAdvance) {
      goToStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-8">
        {/* Numbered step indicator — hidden on the intro screen */}
        {!isIntro && (
          <div
            className={`font-serif text-sm tracking-widest text-muted transition-opacity duration-200 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <span className="text-base-content font-semibold">
              {String(step + 1).padStart(2, "0")}
            </span>
            <span className="mx-1">/</span>
            <span>{String(STEP_COUNT).padStart(2, "0")}</span>
          </div>
        )}

        <div
          className={`flex flex-col gap-6 transition-opacity duration-200 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {isIntro && (
            <div className="flex flex-col gap-3">
              <h1 className="font-serif text-4xl font-semibold text-base-content">
                Let&apos;s find the news you actually want.
              </h1>
            </div>
          )}

          {step === 0 && (
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-3xl font-semibold text-base-content">
                In a few words, what&apos;s something you&apos;re interested in?
              </h1>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                placeholder="e.g. the Knicks, Travel deals, ..."
                className="mt-4 w-full bg-transparent border-0 border-b border-base-300 outline-none focus:border-base-content transition-colors font-serif text-2xl font-semibold text-base-content placeholder:text-base-content-4 pb-2"
              />
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-3xl font-semibold text-base-content">
                For articles about <span className="font-bold">{name}</span>,
                what words or phrases <span className="underline">must</span>{" "}
                show up?
              </h1>
              <div className="mt-4">
                <TagInput
                  tags={allTerms}
                  onChange={setAllTerms}
                  placeholder="Type and press Enter…"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-3xl font-semibold text-base-content">
                For articles about <span className="font-bold">{name}</span>,
                what words or phrases <span className="underline">could</span>{" "}
                show up?
              </h1>
              <div className="mt-4">
                <TagInput
                  tags={anyTerms}
                  onChange={setAnyTerms}
                  placeholder="Type and press Enter…"
                />
              </div>
              {!canFinish && (
                <p className="text-muted text-xs mt-4">
                  Add at least one required or optional term before finishing.
                </p>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-error text-sm">{error}</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              onClick={() => goToStep(step - 1)}
              disabled={isSaving}
              className="flex items-center gap-2 text-muted hover:text-base-content transition-colors w-fit"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Back</span>
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleNext}
            disabled={isLastStep ? !canFinish || isSaving : !canAdvance}
            className="btn-primary"
          >
            {isLastStep
              ? isSaving
                ? "Saving…"
                : "Finish"
              : isIntro
                ? "Get started"
                : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
