"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { useWallStore } from "@/store/useWallStore";
import { getTheme } from "@/lib/themes";

export function AddNoteButton() {
  const wall = useWallStore((s) => s.getActiveWall());
  const addNote = useWallStore((s) => s.addNote);
  const theme = getTheme("skyblue");

  const handleClick = useCallback(() => {
    if (!wall) return;
    const NOTE_WIDTH = 220;
    const GAP = 24;
    const defaultX = 80;
    const defaultY = 80;
    const notes = wall.notes;
    const leftmostX = notes.length > 0 ? Math.min(...notes.map((n) => n.x)) : defaultX + NOTE_WIDTH + GAP;
    const newX = Math.max(0, leftmostX - NOTE_WIDTH - GAP);
    const newY = notes.length > 0 ? notes[0].y : defaultY;
    addNote(wall.id, newX, newY);
  }, [wall, addNote]);

  if (!wall) return null;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      className="font-display absolute bottom-6 right-6 flex h-14 min-h-[48px] w-14 min-w-[48px] items-center justify-center rounded-full border-2 border-black/15 shadow-lg transition-shadow duration-200 hover:shadow-[0_0_24px_rgba(0,255,255,0.4)] sm:bottom-8 sm:right-8 touch-manipulation"
      style={{
        backgroundColor: theme.accent,
        color: theme.bg,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      title="Add note (N)"
    >
      <span className="text-2xl font-bold">+</span>
    </motion.button>
  );
}
