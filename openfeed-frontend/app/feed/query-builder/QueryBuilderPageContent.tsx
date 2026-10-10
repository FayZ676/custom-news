"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import InterestEditor from "@/components/InterestEditor";
import {
  deleteInterestAction,
  saveInterestAction,
  updateInterestAction,
} from "@/app/feed/actions";

interface QueryBuilderPageContentProps {
  interestId?: string;
  initialText: string;
}

export function QueryBuilderPageContent({
  interestId,
  initialText,
}: QueryBuilderPageContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSave = (text: string) => {
    startTransition(async () => {
      if (interestId) {
        await updateInterestAction(interestId, text);
      } else {
        await saveInterestAction(text);
      }
      router.push("/feed");
    });
  };

  const handleDelete = interestId
    ? () => {
        startTransition(async () => {
          await deleteInterestAction(interestId);
          router.push("/feed");
        });
      }
    : undefined;

  return (
    <InterestEditor
      key={interestId ?? "new"}
      initialText={initialText}
      onSave={handleSave}
      onBack={() => startTransition(() => router.push("/feed"))}
      onDelete={handleDelete}
      isSaving={isPending}
    />
  );
}
