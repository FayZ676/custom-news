"use client";

import { useRouter } from "next/navigation";

export default function OnboardingContinueButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/feed")}
      className="btn-soft"
    >
      Start reading
    </button>
  );
}
