"use client";

import { createContext, useCallback, useContext, useState } from "react";

type UnreadCountContextValue = {
  unreadCount: number;
  adjustCount: (delta: number) => void;
};

const UnreadCountContext = createContext<UnreadCountContextValue | null>(null);

export function UnreadCountProvider({
  initialCount,
  children,
}: {
  initialCount: number;
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(initialCount);

  const adjustCount = useCallback(
    (delta: number) => setUnreadCount((prev) => Math.max(0, prev + delta)),
    [],
  );

  return (
    <UnreadCountContext value={{ unreadCount, adjustCount }}>
      {children}
    </UnreadCountContext>
  );
}

export function useUnreadCount() {
  const ctx = useContext(UnreadCountContext);
  if (!ctx)
    throw new Error("useUnreadCount must be used within UnreadCountProvider");
  return ctx;
}
