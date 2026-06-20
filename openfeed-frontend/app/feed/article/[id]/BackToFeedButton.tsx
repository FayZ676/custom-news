"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackToFeedButton() {
  const router = useRouter();

  const handleClick = () => {
    router.refresh();
    router.push("/feed");
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 text-muted hover:text-base-content transition-colors w-fit"
    >
      <ArrowLeft size={16} />
      <span className="text-sm">Back to your news</span>
    </button>
  );
}
