"use client";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import { useWallStore } from "@/store/useWallStore";
import { getTheme } from "@/lib/themes";
import { StickyNote } from "./StickyNote";

const GRID_SIZE = 32;

/**
 * Simple flat wall: white + subtle sky blue grid. No 3D.
 */
export function GridWall() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 700 });
  const wall = useWallStore((s) => s.getActiveWall());
  const addNote = useWallStore((s) => s.addNote);
  const zoom = useWallStore((s) => s.zoom);
  const setZoom = useWallStore((s) => s.setZoom);
  const searchQuery = useWallStore((s) => s.searchQuery);
  const removeConnection = useWallStore((s) => s.removeConnection);
  const tempConnection = useWallStore((s) => s.tempConnection);
  const theme = getTheme("skyblue");

  const filteredNotes = useMemo(() => {
    if (!wall?.notes) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return wall.notes;
    return wall.notes.filter(
      (n) =>
        n.content.toLowerCase().includes(q) ||
        (n.date ?? "").toLowerCase().includes(q)
    );
  }, [wall?.notes, searchQuery]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!wall || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const wallWidth = size.w / zoom;
      const wallHeight = size.h / zoom;
      const NOTE_WIDTH = 220;
      const NOTE_HEIGHT = 200;
      const wallX = Math.max(
        0,
        Math.min(
          Math.max(wallWidth - NOTE_WIDTH, 0),
          px / zoom - NOTE_WIDTH / 2
        )
      );
      const wallY = Math.max(
        0,
        Math.min(
          Math.max(wallHeight - NOTE_HEIGHT, 0),
          py / zoom - NOTE_HEIGHT / 2
        )
      );
      addNote(wall.id, wallX, wallY);
    },
    [wall, addNote, size, zoom]
  );

  const setConnectionFromNoteId = useWallStore((s) => s.setConnectionFromNoteId);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnectionFromNoteId(null);
      }
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.closest("textarea") || target.closest("input")) return;
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
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [wall, addNote, setConnectionFromNoteId]);

  if (!wall) {
    return (
      <div className="flex h-full w-full items-center justify-center font-display text-lg text-slate-600">
        No wall selected. Create one from the sidebar.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-wall-export
      className="relative h-full w-full overflow-hidden"
      style={{
        background: theme.bg,
        backgroundImage: theme.bgGradient && theme.bgGradient !== "none" ? theme.bgGradient : undefined,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Subtle grid lines (like image: thin light cyan on white) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, ${theme.grid} 1px, transparent 1px),
            linear-gradient(0deg, ${theme.grid} 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      />
      {theme.gridAccent && (
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage: `
              linear-gradient(90deg, ${theme.gridAccent} 1px, transparent 1px),
              linear-gradient(0deg, ${theme.gridAccent} 1px, transparent 1px)
            `,
            backgroundSize: `${GRID_SIZE * 4}px ${GRID_SIZE * 4}px`,
          }}
        />
      )}

      {/* Connection lines - click to remove (only show if both notes visible) */}
      <svg
        className="absolute left-0 top-0 cursor-pointer"
        width={size.w}
        height={size.h}
        style={{ overflow: "visible", pointerEvents: "stroke" }}
      >
        {/* Established connections */}
        {(wall.connections ?? []).map((conn) => {
          const from = filteredNotes.find((n) => n.id === conn.fromNoteId);
          const to = filteredNotes.find((n) => n.id === conn.toNoteId);
          if (!from || !to) return null;
          const x1 = (from.x + from.width / 2) * zoom;
          const y1 = (from.y + from.height / 2) * zoom;
          const x2 = (to.x + to.width / 2) * zoom;
          const y2 = (to.y + to.height / 2) * zoom;
          return (
            <g key={conn.id} onClick={() => removeConnection(wall.id, conn.id)}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="transparent"
                strokeWidth={14}
                strokeLinecap="round"
              />
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={theme.accent}
                strokeWidth={2}
                strokeOpacity={0.7}
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Temporary connection dragging line */}
        {tempConnection && (() => {
          const from = filteredNotes.find((n) => n.id === tempConnection.fromNoteId);
          if (!from) return null;
          const x1 = (from.x + from.width / 2) * zoom;
          const y1 = (from.y + from.height / 2) * zoom;
          return (
            <line
              x1={x1}
              y1={y1}
              x2={tempConnection.toX * zoom}
              y2={tempConnection.toY * zoom}
              stroke={theme.accent}
              strokeWidth={2}
              strokeDasharray="5,5"
              strokeOpacity={0.8}
              strokeLinecap="round"
              className="pointer-events-none"
            />
          );
        })()}
      </svg>

      {/* Notes layer - flat 2D, filtered by search */}
      <div className="absolute inset-0">
        {filteredNotes.map((note) => (
          <StickyNote key={note.id} note={note} wallId={wall.id} />
        ))}
      </div>

      {/* Zoom controls (bottom-left), touch-friendly on mobile */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-0.5 rounded-full bg-white/90 px-1 py-1 text-xs text-slate-700 shadow-lg sm:bottom-4 sm:left-4">
        <button
          type="button"
          className="pointer-events-auto flex h-9 min-h-[44px] w-9 min-w-[44px] items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 sm:h-8 sm:min-h-0 sm:w-8 sm:min-w-0"
          onClick={() => setZoom(zoom - 0.1)}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="pointer-events-auto min-w-[2.5rem] select-none text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          className="pointer-events-auto flex h-9 min-h-[44px] w-9 min-w-[44px] items-center justify-center rounded-full hover:bg-slate-100 active:bg-slate-200 sm:h-8 sm:min-h-0 sm:w-8 sm:min-w-0"
          onClick={() => setZoom(zoom + 0.1)}
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );
}
