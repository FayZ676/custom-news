"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import SentenceQueryBuilder from "@/components/QueryBuilder/SentenceQueryBuilder";
import { deleteQueryAction, saveQueryAction, updateQueryAction } from "@/app/feed/actions";
import type { FeedDefinition } from "@/lib/providers/types";

interface QueryBuilderPageContentProps {
  userId: string;
  interestId?: string;
  initialName: string;
  initialAll: string[];
  initialAny: string[];
  initialSources: string[];
  availableSources: FeedDefinition[];
}

export function QueryBuilderPageContent({
  userId,
  interestId,
  initialName,
  initialAll,
  initialAny,
  initialSources,
  availableSources,
}: QueryBuilderPageContentProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (name: string, all: string[], any: string[], sources: string[]) => {
    setIsSaving(true);
    try {
      if (interestId) {
        await updateQueryAction(userId, interestId, name, all, any, sources);
      } else {
        await saveQueryAction(userId, name, all, any, sources);
      }
      router.push("/feed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = interestId
    ? async () => {
        await deleteQueryAction(userId, interestId);
        router.push("/feed");
      }
    : undefined;

  return (
    <SentenceQueryBuilder
      key={interestId ?? "new"}
      initialName={initialName}
      initialAll={initialAll}
      initialAny={initialAny}
      initialSources={initialSources}
      availableSources={availableSources}
      onSave={handleSave}
      onBack={() => router.push("/feed")}
      onDelete={handleDelete}
      isSaving={isSaving}
    />
  );
}
