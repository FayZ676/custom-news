"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import SentenceQueryBuilder from "@/components/QueryBuilder/SentenceQueryBuilder";
import { deleteQueryAction, saveQueryAction, updateQueryAction } from "@/app/feed/actions";

interface QueryBuilderPageContentProps {
  userId: string;
  interestId?: string;
  initialName: string;
  initialAll: string[];
  initialAny: string[];
}

export function QueryBuilderPageContent({
  userId,
  interestId,
  initialName,
  initialAll,
  initialAny,
}: QueryBuilderPageContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSave = (name: string, all: string[], any: string[]) => {
    startTransition(async () => {
      if (interestId) {
        await updateQueryAction(userId, interestId, name, all, any);
      } else {
        await saveQueryAction(userId, name, all, any);
      }
      router.push("/feed");
    });
  };

  const handleDelete = interestId
    ? () => {
        startTransition(async () => {
          await deleteQueryAction(userId, interestId);
          router.push("/feed");
        });
      }
    : undefined;

  return (
    <SentenceQueryBuilder
      key={interestId ?? "new"}
      initialName={initialName}
      initialAll={initialAll}
      initialAny={initialAny}
      onSave={handleSave}
      onBack={() => startTransition(() => router.push("/feed"))}
      onDelete={handleDelete}
      isSaving={isPending}
    />
  );
}
