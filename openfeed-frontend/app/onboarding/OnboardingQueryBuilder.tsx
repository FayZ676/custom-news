"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import TagInput from "@/components/QueryBuilder/TagInput";
import { saveQueryAction } from "@/app/feed/actions";

interface SourceOption {
  key: string;
  label: string;
}

const STEP_COUNT = 4;
const FADE_MS = 200;

export default function OnboardingQueryBuilder({
  userId,
  availableSources = [],
}: {
  userId: string;
  availableSources?: SourceOption[];
}) {
  const router = useRouter();
  // step -1 is the intro/welcome screen; 0–3 are the four wizard steps.
  const [step, setStep] = useState(-1);
  const [visible, setVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [allTerms, setAllTerms] = useState<string[]>([]);
  const [anyTerms, setAnyTerms] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const toggleSource = (key: string) =>
    setSelectedSources((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

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
      await saveQueryAction(userId, name.trim(), allTerms, anyTerms, selectedSources);
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
                Let&apos;s build your first feed.
              </h1>
              <p className="text-muted text-base leading-relaxed">
                A feed is a saved search that pulls in news matching what you
                care about. In the next few steps you&apos;ll name a topic,
                choose the words that should appear in matching articles, and
                optionally pick which sources to draw from.
              </p>
              <p className="text-muted text-base leading-relaxed">
                It only takes a minute, and you can refine it anytime.
              </p>
            </div>
          )}

          {step === 0 && (
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-3xl font-semibold text-base-content">
                What are you interested in?
              </h1>
              <p className="text-muted text-sm">
                Give your feed a name — a topic, a beat, a question you&apos;re
                following.
              </p>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                placeholder="e.g. AI policy, the Knicks, local elections…"
                className="mt-4 w-full bg-transparent border-0 border-b border-base-300 outline-none focus:border-base-content transition-colors font-serif text-2xl font-semibold text-base-content placeholder:text-base-content-4 pb-2"
              />
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-3xl font-semibold text-base-content">
                What terms have to appear?
              </h1>
              <p className="text-muted text-sm">
                Every term you add must appear in matching articles. Leave blank
                if nothing is strictly required.
              </p>
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
                What terms might also appear?
              </h1>
              <p className="text-muted text-sm">
                At least one of these terms will appear in matching articles.
                Optional, but helps widen your feed.
              </p>
              <div className="mt-4">
                <TagInput
                  tags={anyTerms}
                  onChange={setAnyTerms}
                  placeholder="Type and press Enter…"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-2">
              <h1 className="font-serif text-3xl font-semibold text-base-content">
                Restrict to specific sources?
              </h1>
              <p className="text-muted text-sm">
                Limit results to selected sources, or leave blank to draw from
                everything.
              </p>
              {availableSources.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
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
              ) : (
                <p className="text-muted text-sm mt-4">
                  No sources available to choose from.
                </p>
              )}
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
