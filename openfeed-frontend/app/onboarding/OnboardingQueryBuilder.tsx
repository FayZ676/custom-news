"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import InterestEditor from "@/components/InterestEditor";
import { saveInterestAction } from "@/app/feed/actions";

export default function OnboardingQueryBuilder() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (text: string) => {
    setIsSaving(true);
    setError(null);
    try {
      await saveInterestAction(text);
      router.push("/feed");
    } catch {
      setError("Something went wrong saving your interest. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 py-10">
      <InterestEditor
        title="Let's find the news you actually want."
        subtitle="Start with one topic. You can add more later."
        onSave={handleSave}
        isSaving={isSaving}
      />
      {error && (
        <p className="text-error text-sm max-w-2xl mx-auto px-4">{error}</p>
      )}
    </div>
  );
}
