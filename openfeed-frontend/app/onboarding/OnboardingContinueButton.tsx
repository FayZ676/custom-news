"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { refreshArticlesAction } from "@/app/feed/actions";

export default function OnboardingContinueButton({
  userId,
}: {
  userId: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      // Populate the feed before navigating so the user never lands on an empty
      // "You're all caught up" feed. Best-effort: navigate regardless of outcome.
      await refreshArticlesAction(userId);
    } finally {
      router.push("/feed");
    }
  };

  return (
    <button
      onClick={() => void handleClick()}
      disabled={isLoading}
      className="btn-soft disabled:opacity-50"
    >
      {isLoading ? "Setting up your feed…" : "Start reading"}
    </button>
  );
}
