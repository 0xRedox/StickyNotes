"use client";

import { useEffect } from "react";
import { useWallStore } from "@/store/useWallStore";

/**
 * Hydrates Zustand store from LocalStorage on mount (client-only).
 */
export function HydrateStore({ children }: { children: React.ReactNode }) {
  const hydrate = useWallStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  return <>{children}</>;
}
