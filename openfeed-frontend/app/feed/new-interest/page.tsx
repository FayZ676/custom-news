"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { addInterest } from "@/actions/interests";

export default function NewInterestPage() {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      const interestId = await addInterest(query.trim());
      router.push(`/feed?interest=${interestId}`);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-4"
      >
        <h1 className="text-2xl font-bold">Add a new interest</h1>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="e.g. large language models"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isPending}
          autoFocus
        />
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isPending || !query.trim()}
        >
          {isPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            "Add Interest"
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
