"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";

import type { FeedDefinition } from "@/lib/providers/types";
import {
  subscribeSourceAction,
  unsubscribeSourceAction,
} from "@/app/feed/actions";

interface SourcesManagerProps {
  userId: string;
  sources: FeedDefinition[];
  initialSubscribedKeys: string[];
  onSourceSubscribed?: () => void | Promise<void>;
  onSourceUnsubscribed?: () => void | Promise<void>;
}

export function SourcesManager({
  userId,
  sources,
  initialSubscribedKeys,
  onSourceSubscribed,
  onSourceUnsubscribed,
}: SourcesManagerProps) {
  const [subscribed, setSubscribed] = useState<Set<string>>(
    new Set(initialSubscribedKeys),
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const toggle = async (key: string) => {
    if (pendingKey) return;
    const isSubscribed = subscribed.has(key);
    setPendingKey(key);

    setSubscribed((prev) => {
      const next = new Set(prev);
      if (isSubscribed) next.delete(key);
      else next.add(key);
      return next;
    });

    try {
      if (isSubscribed) {
        await unsubscribeSourceAction(userId, key);
        await onSourceUnsubscribed?.();
      } else {
        await subscribeSourceAction(userId, key);
        await onSourceSubscribed?.();
      }
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source) => {
          const isSubscribed = subscribed.has(source.key);
          return (
            <button
              key={source.key}
              onClick={() => void toggle(source.key)}
              disabled={pendingKey === source.key}
              className={`btn-soft flex items-center gap-1 ${
                isSubscribed ? "" : "opacity-60"
              }`}
              aria-pressed={isSubscribed}
            >
              {source.label}
              {isSubscribed ? (
                <Check size={12} className="text-base-content-3" />
              ) : (
                <Plus size={12} className="text-base-content-3" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-base-content-4">
        These sources are searched with your interests, just like the default
        news service. Want another source? Use “Send Feedback” below.
      </p>
    </div>
  );
}
