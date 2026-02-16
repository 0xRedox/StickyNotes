import type { ThemeId } from "@/types/wall";

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  grid: string;
  gridAccent?: string;
  gridGlow?: string;
  bg: string;
  bgGradient?: string;
  accent: string;
  sidebarBg: string;
  sidebarBorder: string;
  text: string;
  textMuted: string;
  defaultNoteColors: string[];
}

/** Single theme: white + sky blue */
export const THEMES: Record<ThemeId, ThemeConfig> = {
  skyblue: {
    id: "skyblue",
    label: "Sky Blue",
    grid: "rgba(0, 180, 216, 0.12)",
    gridAccent: "rgba(0, 180, 216, 0.2)",
    gridGlow: "transparent",
    bg: "#ffffff",
    bgGradient: "none",
    accent: "#00b4d8",
    sidebarBg: "rgba(255, 255, 255, 0.98)",
    sidebarBorder: "rgba(0, 180, 216, 0.25)",
    text: "#0f172a",
    textMuted: "rgba(15, 23, 42, 0.65)",
    defaultNoteColors: ["#fef08a", "#bbf7d0", "#bfdbfe", "#e0f2fe", "#fbcfe8", "#e9d5ff"],
  },
};

export function getTheme(_id?: ThemeId): ThemeConfig {
  return THEMES.skyblue;
}
