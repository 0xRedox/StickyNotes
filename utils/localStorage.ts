import type { Wall } from "@/types/wall";

const STORAGE_KEY = "gridwall_data";

export interface PersistedState {
  walls: Wall[];
  activeWallId: string | null;
}

export function loadFromStorage(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function saveToStorage(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota or disabled storage
  }
}
