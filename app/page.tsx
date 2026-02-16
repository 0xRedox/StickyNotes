"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HydrateStore } from "@/components/HydrateStore";
import { Sidebar } from "@/components/Sidebar";
import { GridWall } from "@/components/GridWall";
import { CalendarView } from "@/components/CalendarView";
import { AddNoteButton } from "@/components/AddNoteButton";
import { useWallStore } from "@/store/useWallStore";

export type ViewMode = "wall" | "calendar";

function MainContent({ viewMode }: { viewMode: ViewMode }) {
  const activeWallId = useWallStore((s) => s.activeWallId);

  return (
    <>
      <AnimatePresence mode="wait">
        {viewMode === "wall" ? (
          <motion.div
            key={`wall-${activeWallId ?? "empty"}`}
            className="h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <GridWall />
          </motion.div>
        ) : (
          <motion.div
            key="calendar"
            className="h-full w-full overflow-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <CalendarView />
          </motion.div>
        )}
      </AnimatePresence>
      {viewMode === "wall" && <AddNoteButton />}
    </>
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("wall");

  return (
    <HydrateStore>
      <div className="flex h-screen w-screen overflow-hidden bg-white">
        <Sidebar viewMode={viewMode} setViewMode={setViewMode} />
        <main className="relative flex-1 overflow-hidden bg-white">
          <MainContent viewMode={viewMode} />
        </main>
      </div>
    </HydrateStore>
  );
}
