/**
 * Sticky note entity. Position/size are in "wall space" (0–1 normalized or pixel).
 * We use pixel values for precise placement on the perspective wall.
 */
export interface Note {
  id: string;
  wallId: string;
  content: string;
  color: string; // hex or theme color key
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  /** Optional date (YYYY-MM-DD) for due date or reminder / calendar */
  date?: string;
  /** Checkbox / task done state */
  checked?: boolean;
}

export const DEFAULT_NOTE = {
  width: 200,
  height: 180,
  content: "",
  color: "#fef08a",
} as const;

export const NOTE_COLORS = [
  "#fef08a", // yellow
  "#bbf7d0", // green
  "#bfdbfe", // blue
  "#fbcfe8", // pink
  "#e9d5ff", // purple
  "#fed7aa", // orange
  "#e0e7ff", // indigo
  "#fce7f3", // rose
] as const;
