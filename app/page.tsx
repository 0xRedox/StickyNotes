"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HydrateStore } from "@/components/HydrateStore";
import { Sidebar } from "@/components/Sidebar";
import { GridWall } from "@/components/GridWall";
import { CalendarView } from "@/components/CalendarView";
import { AddNoteButton } from "@/components/AddNoteButton";
import { useWallStore } from "@/store/useWallStore";
import { getTheme } from "@/lib/themes";

export type ViewMode = "wall" | "calendar";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function MainContent({
  viewMode,
  setViewMode,
  onOpenSidebar,
}: {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  onOpenSidebar: () => void;
}) {
  const activeWallId = useWallStore((s) => s.activeWallId);
  const isMobile = useIsMobile();
  const theme = getTheme("skyblue");

  return (
    <>
      {/* Mobile header: menu + title + view tabs */}
      {isMobile && (
        <header
          className="flex flex-shrink-0 items-center gap-2 border-b px-3 py-2.5 md:hidden"
          style={{ borderColor: theme?.sidebarBorder }}
        >
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors active:opacity-80"
            style={{ borderColor: theme?.sidebarBorder }}
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" style={{ color: theme?.accent }} />
          </button>
          <span className="font-display text-sm font-semibold truncate" style={{ color: theme?.accent }}>
            GridWall
          </span>
          <div className="flex flex-1 justify-end gap-0.5 rounded-lg border p-0.5" style={{ borderColor: theme?.sidebarBorder }}>
            <button
              type="button"
              onClick={() => setViewMode("wall")}
              className="min-h-[36px] flex-1 rounded-md px-2 text-xs font-medium"
              style={{
                backgroundColor: viewMode === "wall" ? theme?.accent + "22" : "transparent",
                color: viewMode === "wall" ? theme?.accent : theme?.textMuted,
              }}
            >
              Wall
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className="min-h-[36px] flex-1 rounded-md px-2 text-xs font-medium"
              style={{
                backgroundColor: viewMode === "calendar" ? theme?.accent + "22" : "transparent",
                color: viewMode === "calendar" ? theme?.accent : theme?.textMuted,
              }}
            >
              Calendar
            </button>
          </div>
        </header>
      )}
      <AnimatePresence mode="wait">
        {viewMode === "wall" ? (
          <motion.div
            key={`wall-${activeWallId ?? "empty"}`}
            className="h-full min-h-0 w-full flex-1"
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
            className="h-full min-h-0 w-full flex-1 overflow-auto"
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

function MenuIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("wall");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasHydrated = useWallStore((s) => s.hasHydrated);
  const isMobile = useIsMobile();

  return (
    <HydrateStore>
      {!hasHydrated ? (
        <div className="flex h-screen w-screen items-center justify-center bg-white">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      ) : (
        <div className="flex h-screen w-screen overflow-hidden bg-white">
          {/* Backdrop when sidebar open on mobile */}
          {isMobile && sidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
              aria-label="Close menu"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Sidebar
            viewMode={viewMode}
            setViewMode={setViewMode}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isMobile={isMobile}
          />
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
            <MainContent
              viewMode={viewMode}
              setViewMode={setViewMode}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
          </main>
        </div>
      )}
    </HydrateStore>
  );
}
