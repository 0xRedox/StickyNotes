"use client";

import { memo, useCallback, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Note } from "@/types/note";
import { NOTE_COLORS } from "@/types/note";
import { useWallStore } from "@/store/useWallStore";

const MIN_WIDTH = 120;
const MIN_HEIGHT = 80;
const MAX_WIDTH = 400;
const MAX_HEIGHT = 400;

interface StickyNoteProps {
  note: Note;
  wallId: string;
}

function StickyNoteInner({ note, wallId }: StickyNoteProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });

  const updateNote = useWallStore((s) => s.updateNote);
  const deleteNote = useWallStore((s) => s.deleteNote);
  const moveNote = useWallStore((s) => s.moveNote);
  const resizeNote = useWallStore((s) => s.resizeNote);
  const togglePin = useWallStore((s) => s.togglePinNote);
  const toggleCheck = useWallStore((s) => s.toggleCheckNote);
  const connectionFromNoteId = useWallStore((s) => s.connectionFromNoteId);
  const setConnectionFromNoteId = useWallStore((s) => s.setConnectionFromNoteId);
  const addConnection = useWallStore((s) => s.addConnection);
  const duplicateNote = useWallStore((s) => s.duplicateNote);
  const zoom = useWallStore((s) => s.zoom);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNote(wallId, note.id, { content: e.target.value });
    },
    [wallId, note.id, updateNote]
  );

  const handleColorSelect = useCallback(
    (color: string) => {
      updateNote(wallId, note.id, { color });
      setShowColorPicker(false);
    },
    [wallId, note.id, updateNote]
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value || undefined;
      updateNote(wallId, note.id, { date: value });
    },
    [wallId, note.id, updateNote]
  );

  const formatDisplayDate = (iso: string) => {
    try {
      const d = new Date(iso + "T12:00:00");
      return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  };

  const handleDelete = useCallback(() => {
    deleteNote(wallId, note.id);
  }, [wallId, note.id, deleteNote]);

  const handleLinkClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (connectionFromNoteId === null) {
        setConnectionFromNoteId(note.id);
      } else if (connectionFromNoteId === note.id) {
        setConnectionFromNoteId(null);
      } else {
        addConnection(wallId, connectionFromNoteId, note.id);
      }
    },
    [connectionFromNoteId, note.id, wallId, setConnectionFromNoteId, addConnection]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const target = document.activeElement;
      if (target?.closest(`[data-note-id="${note.id}"]`)) {
        if (target instanceof HTMLTextAreaElement && target.value.length) return;
        e.preventDefault();
        handleDelete();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [note.id, handleDelete]);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        w: note.width,
        h: note.height,
      };
    },
    [note.width, note.height]
  );

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const dx = (e.clientX - resizeStartRef.current.x) / zoom;
      const dy = (e.clientY - resizeStartRef.current.y) / zoom;
      const newW = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartRef.current.w + dx));
      const newH = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, resizeStartRef.current.h + dy));
      resizeNote(wallId, note.id, newW, newH);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing, wallId, note.id, resizeNote]);

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, textarea")) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStartRef.current = { x: e.clientX - note.x * zoom, y: e.clientY - note.y * zoom };
    },
    [note.x, note.y, zoom]
  );
  const handleDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        const screenX = e.clientX - dragStartRef.current.x;
        const screenY = e.clientY - dragStartRef.current.y;
        const x = Math.max(0, screenX / zoom);
        const y = Math.max(0, screenY / zoom);
        moveNote(wallId, note.id, x, y);
      }
    },
    [wallId, note.id, moveNote, zoom]
  );
  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <motion.div
      data-note-id={note.id}
      className="absolute cursor-grab active:cursor-grabbing select-none"
      style={{
        left: note.x * zoom,
        top: note.y * zoom,
        width: note.width * zoom,
        height: note.height * zoom,
        outline: connectionFromNoteId === note.id ? "2px solid #00b4d8" : undefined,
        outlineOffset: 2,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerLeave={handleDragEnd}
      whileHover={{ boxShadow: "0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)" }}
    >
      <div
        className="h-full w-full overflow-hidden rounded-lg border border-white/20"
        style={{
          backgroundColor: note.color,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)",
          transform: "rotate(-0.5deg)",
        }}
      >
        <div className="flex items-start justify-between gap-1 px-2.5 pt-2.5 pb-1">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-black/25 bg-white/50 hover:bg-white/80"
              onClick={() => toggleCheck(wallId, note.id)}
              title={note.checked ? "Mark incomplete" : "Mark done"}
            >
              {note.checked && (
                <svg className="h-3 w-3 text-black/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="rounded p-0.5 text-[rgba(0,0,0,0.75)] hover:bg-black/10 hover:text-black"
              onClick={() => togglePin(wallId, note.id)}
              title={note.isPinned ? "Unpin" : "Pin"}
            >
              {note.isPinned ? (
                <PinIcon className="h-3.5 w-3.5" />
              ) : (
                <PinIconOutline className="h-3.5 w-3.5" />
              )}
            </button>
            <div className="relative flex-1">
              <button
                type="button"
                className="rounded p-0.5 text-[rgba(0,0,0,0.75)] hover:bg-black/10 hover:text-black"
                onClick={() => setShowColorPicker((v) => !v)}
                title="Change color"
              >
                <PaletteIcon className="h-3.5 w-3.5" />
              </button>
              {showColorPicker && (
                <div className="absolute left-0 top-full z-50 mt-1 flex flex-wrap gap-0.5 rounded bg-black/10 p-1.5 shadow-lg backdrop-blur">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="h-5 w-5 rounded-full border-2 border-white/50 shadow"
                      style={{ backgroundColor: c }}
                      onClick={() => handleColorSelect(c)}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="rounded p-0.5 text-[rgba(0,0,0,0.75)] hover:bg-black/10 hover:text-black"
              onClick={(e) => { e.stopPropagation(); duplicateNote(wallId, note.id); }}
              title="Duplicate note"
            >
              <DuplicateIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded p-0.5 text-[rgba(0,0,0,0.75)] hover:bg-black/10 hover:text-black cursor-crosshair touch-none"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Start drag connection
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const startX = rect.left + rect.width / 2;
                const startY = rect.top + rect.height / 2;

                const onPointerMove = (ev: PointerEvent) => {
                  const scrollX = window.scrollX;
                  const scrollY = window.scrollY;
                  // We need to convert screen coordinates to wall coordinates if possible, 
                  // but for the temp line, we'll store screen-relative or wall-relative offset.
                  // Since StickyNote is positioned absolutely in the wall container, let's try to get the wall container offset.
                  // Actually, easier way: The wall container handles the temp line rendering. The coordinates needed depend on how the line is drawn.
                  // The line in GridWall is drawn inside the same coordinate system as notes (absolute positioning).

                  // Let's find the wall container to get relative coordinates.
                  const wallContainer = document.querySelector('[data-wall-export]');
                  if (!wallContainer) return;
                  const wallRect = wallContainer.getBoundingClientRect();

                  const relX = (ev.clientX - wallRect.left) / zoom;
                  const relY = (ev.clientY - wallRect.top) / zoom;

                  useWallStore.getState().setTempConnection({
                    fromNoteId: note.id,
                    toX: relX,
                    toY: relY,
                  });
                };

                const onPointerUp = (ev: PointerEvent) => {
                  const target = document.elementFromPoint(ev.clientX, ev.clientY);
                  const targetNoteEl = target?.closest('[data-note-id]');
                  if (targetNoteEl) {
                    const targetId = targetNoteEl.getAttribute('data-note-id');
                    if (targetId && targetId !== note.id) {
                      addConnection(wallId, note.id, targetId);
                    }
                  }

                  useWallStore.getState().setTempConnection(null);
                  window.removeEventListener("pointermove", onPointerMove);
                  window.removeEventListener("pointerup", onPointerUp);
                };

                window.addEventListener("pointermove", onPointerMove);
                window.addEventListener("pointerup", onPointerUp);
              }}
              title="Drag to connect to another note"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="rounded p-0.5 text-[rgba(0,0,0,0.75)] hover:bg-black/10 hover:text-black"
              onClick={handleDelete}
              title="Delete"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Optional date */}
        <div className="px-2.5 pb-1.5">
          <input
            type="date"
            value={note.date ?? ""}
            onChange={handleDateChange}
            onPointerDown={(e) => e.stopPropagation()}
            className="font-note w-full rounded border-0 bg-black/6 py-1 px-2 text-[13px] font-medium tracking-wide outline-none placeholder:font-normal placeholder:opacity-60"
            style={{ color: "rgba(0, 0, 0, 0.75)" }}
            title="Add or change date"
          />
          {note.date && (
            <p className="font-note mt-0.5 text-[12px] font-medium tracking-wide opacity-80" style={{ color: "rgba(0, 0, 0, 0.7)" }}>
              {formatDisplayDate(note.date)}
            </p>
          )}
        </div>

        <textarea
          ref={textareaRef}
          className="font-note w-full flex-1 resize-none border-0 bg-transparent px-2.5 pb-2 pt-0 text-[15px] leading-[1.55] tracking-wide outline-none placeholder:font-normal placeholder:text-[rgba(0,0,0,0.5)]"
          style={{
            height: note.height - (note.date ? 106 : 82),
            minHeight: 48,
            color: "rgba(0, 0, 0, 0.9)",
            caretColor: "rgba(0, 0, 0, 0.95)",
            textDecoration: note.checked ? "line-through" : undefined,
            opacity: note.checked ? 0.75 : 1,
          }}
          value={note.content}
          onChange={handleContentChange}
          placeholder="Write something..."
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        />
        <div
          className="absolute bottom-0 right-0 cursor-se-resize p-1 touch-none text-[rgba(0,0,0,0.6)] hover:text-black"
          onPointerDown={handleResizeStart}
        >
          <ResizeIcon className="h-3 w-3" />
        </div>
      </div>
    </motion.div>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
  );
}
function PinIconOutline({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v10m0 0l-3 3m3-3l3 3" />
      <path d="M5 12h14l-2 2v6h-2v-6l-2-2" />
    </svg>
  );
}
function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  );
}
function DuplicateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
function ResizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 21h-4v-2h2v-2h2v4zM17 17H7v-4H5v6h14v-2h-2zM3 5h2v2H3V5zm4 0h2v2H7V5zm4 0h2v2h-2V5zm4 0h2v2h-2V5zm0 4h2v2h-2V9zM3 9h2v2H3V9zm0 4h2v2H3v-2zm0 4h2v2H3v-2z" />
    </svg>
  );
}

export const StickyNote = memo(StickyNoteInner);
