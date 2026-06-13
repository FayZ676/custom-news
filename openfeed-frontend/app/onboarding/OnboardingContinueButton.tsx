"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { refreshUserArticlesAction } from "@/app/feed/actions";

export default function OnboardingContinueButton() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      // Trigger the first article fetch for the interests just added, so the
      // feed isn't empty on arrival. Best-effort: the hourly cron is a backstop.
      await refreshUserArticlesAction();
    } catch {
      // Ignore — the feed will populate on the next scheduled refresh.
    }
    router.push("/feed");
  };

  return (
    <button
      onClick={() => void handleStart()}
      disabled={isStarting}
      className="btn-soft"
    >
      {isStarting ? "Building your feed…" : "Start reading"}
    </button>
  );
}
