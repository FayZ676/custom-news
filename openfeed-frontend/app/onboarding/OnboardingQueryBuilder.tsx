"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import SentenceQueryBuilder from "@/components/QueryBuilder/SentenceQueryBuilder";
import { saveQueryAction } from "@/app/feed/actions";

export default function OnboardingQueryBuilder({ userId }: { userId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (name: string, all: string[], any: string[], sources: string[]) => {
    setIsSaving(true);
    setError(null);
    try {
      await saveQueryAction(userId, name, all, any, sources);
      router.push("/feed");
    } catch {
      setError("Something went wrong saving your query. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {error && <p className="text-error text-sm text-center pt-4">{error}</p>}
      <SentenceQueryBuilder
        onSave={handleSave}
        onBack={() => router.push("/")}
        isSaving={isSaving}
      />
    </>
  );
}
