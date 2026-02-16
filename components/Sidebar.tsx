"use client";

import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import { useWallStore } from "@/store/useWallStore";
import { getTheme } from "@/lib/themes";
import type { ViewMode } from "@/app/page";

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ viewMode, setViewMode, isOpen = false, onClose, isMobile = false }: SidebarProps) {
  const walls = useWallStore((s) => s.walls);
  const activeWallId = useWallStore((s) => s.activeWallId);
  const setActiveWall = useWallStore((s) => s.setActiveWall);
  const createWall = useWallStore((s) => s.createWall);
  const updateWall = useWallStore((s) => s.updateWall);
  const deleteWall = useWallStore((s) => s.deleteWall);
  const importWall = useWallStore((s) => s.importWall);
  const exportWallAsJson = useWallStore((s) => s.exportWallAsJson);
  const searchQuery = useWallStore((s) => s.searchQuery);
  const setSearchQuery = useWallStore((s) => s.setSearchQuery);
  const wall = useWallStore((s) => s.getActiveWall());
  const theme = getTheme("skyblue");

  const [importError, setImportError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const runExportAsImage = useCallback(async () => {
    if (!wall) return;
    const el = document.querySelector("[data-wall-export]") as HTMLElement | null;
    if (!el) {
      setExportError("Switch to Wall view first, then try again.");
      return;
    }
    setExportError(null);
    setExporting(true);
    try {
      const rect = el.getBoundingClientRect();
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        width: rect.width,
        height: rect.height,
        windowWidth: rect.width,
        windowHeight: rect.height,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
      });
      canvas.toBlob(
        (blob) => {
          setExporting(false);
          if (!blob) {
            setExportError("Export failed.");
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `gridwall-${wall.name.replace(/\s+/g, "-")}.png`;
          a.click();
          URL.revokeObjectURL(url);
        },
        "image/png",
        1
      );
    } catch (e) {
      setExporting(false);
      setExportError("Export failed. Try switching to Wall view first.");
      console.error("Export as image failed:", e);
    }
  }, [wall]);

  const handleExportAsImage = useCallback(() => {
    setExportError(null);
    if (viewMode !== "wall") {
      setViewMode("wall");
      setTimeout(() => runExportAsImage(), 600);
    } else {
      runExportAsImage();
    }
  }, [viewMode, setViewMode, runExportAsImage]);

  const handleStartRename = (w: { id: string; name: string }) => {
    setEditingId(w.id);
    setEditName(w.name);
  };
  const handleSaveRename = () => {
    if (editingId && editName.trim()) {
      updateWall(editingId, { name: editName.trim() });
      setEditingId(null);
    }
  };

  const sidebarStyle = theme
    ? {
      backgroundColor: theme.sidebarBg,
      borderColor: theme.sidebarBorder,
      color: theme.text,
    }
    : undefined;

  return (
    <aside
      className={`
        flex w-64 flex-shrink-0 flex-col border-r backdrop-blur-xl transition-colors duration-300
        md:relative md:translate-x-0
        ${isMobile ? "fixed inset-y-0 left-0 z-50 w-[min(288px,85vw)] transform border-r shadow-xl transition-transform duration-200" : ""}
        ${isMobile && !isOpen ? "-translate-x-full" : ""}
        ${isMobile && isOpen ? "translate-x-0" : ""}
      `}
      style={sidebarStyle}
    >
      <div className="flex flex-shrink-0 items-start justify-between border-b p-4 transition-colors duration-300" style={{ borderColor: theme?.sidebarBorder }}>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight" style={{ color: theme?.accent }}>
            GridWall
          </h1>
          <p className="mt-1 text-xs opacity-70 transition-opacity duration-200">Notes & calendar</p>
        </div>
        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border transition-colors active:opacity-80"
            style={{ borderColor: theme?.sidebarBorder }}
            aria-label="Close menu"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        )}
      </div>
      <div className="border-b px-4 pb-3 pt-0 transition-colors duration-300 md:border-b-0 md:p-4 md:pt-4" style={{ borderColor: theme?.sidebarBorder }}>
        <div className="mt-3 flex gap-1 rounded-lg border p-0.5" style={{ borderColor: theme?.sidebarBorder }}>
          <button
            type="button"
            onClick={() => { setViewMode("wall"); onClose?.(); }}
            className="flex-1 rounded-md py-1.5 text-xs font-medium transition-colors min-h-[44px] touch-manipulation"
            style={{
              backgroundColor: viewMode === "wall" ? theme?.accent + "22" : "transparent",
              color: viewMode === "wall" ? theme?.accent : theme?.textMuted,
            }}
          >
            Wall
          </button>
          <button
            type="button"
            onClick={() => { setViewMode("calendar"); onClose?.(); }}
            className="flex-1 rounded-md py-1.5 text-xs font-medium transition-colors min-h-[44px] touch-manipulation"
            style={{
              backgroundColor: viewMode === "calendar" ? theme?.accent + "22" : "transparent",
              color: viewMode === "calendar" ? theme?.accent : theme?.textMuted,
            }}
          >
            Calendar
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        {viewMode === "wall" && (
          <div className="space-y-1">
            <label className="text-xs font-medium opacity-80">Search notes</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content or date..."
              className="w-full rounded-lg border bg-white/80 px-2.5 py-1.5 text-sm outline-none"
              style={{ borderColor: theme?.sidebarBorder }}
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium opacity-80">Walls</span>
            <button
              type="button"
              onClick={() => createWall()}
              className="font-display rounded-lg border px-2 py-1 text-xs font-semibold transition-all duration-200 hover:opacity-100"
              style={{
                backgroundColor: theme?.accent + "22",
                color: theme?.accent,
                borderColor: theme?.accent + "55",
              }}
            >
              + New
            </button>
          </div>
          <ul className="space-y-0.5 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {walls.map((w) => (
                <motion.li
                  key={w.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="group flex items-center gap-1 rounded-lg"
                >
                  {editingId === w.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleSaveRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="min-w-0 flex-1 rounded border bg-black/5 px-2 py-1 text-sm outline-none"
                      style={{ borderColor: theme?.sidebarBorder }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveWall(w.id)}
                        className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm transition-all duration-200 hover:bg-black/5"
                        style={{
                          backgroundColor: activeWallId === w.id ? theme?.accent + "18" : undefined,
                        }}
                      >
                        {w.name}
                      </button>
                      <div className="flex opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleStartRename(w)}
                          className="rounded p-0.5 hover:bg-black/10"
                          title="Rename"
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteWall(w.id)}
                          className="rounded p-0.5 hover:bg-black/10"
                          title="Delete wall"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        {wall && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleExportAsImage}
              disabled={exporting}
              className="font-display w-full rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:opacity-100 disabled:opacity-60"
              style={{ borderColor: theme?.sidebarBorder }}
            >
              {exporting ? "Exporting…" : "Export wall as image"}
            </button>
            {exportError && (
              <p className="text-[10px] text-red-600">{exportError}</p>
            )}
            <button
              type="button"
              onClick={() => {
                const json = exportWallAsJson(wall.id);
                if (!json) return;
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${wall.name.replace(/\s+/g, "-")}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="font-display w-full rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:opacity-100"
              style={{ borderColor: theme?.sidebarBorder }}
            >
              Export wall data (Save file)
            </button>
            <div>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImportError(null);
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const text = reader.result as string;
                      const imported = importWall(text);
                      if (imported) setActiveWall(imported.id);
                      else setImportError("Invalid file");
                    } catch {
                      setImportError("Invalid file");
                    }
                    e.target.value = "";
                  };
                  reader.readAsText(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-display w-full rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 hover:opacity-100"
                style={{ borderColor: theme?.sidebarBorder }}
              >
                Import wall
              </button>
              {importError && (
                <p className="mt-1 text-[10px] text-red-600">{importError}</p>
              )}
            </div>
          </div>
        )}
        <p className="mt-auto pt-2 text-[10px] text-slate-400">
          N: new note · Click line to remove link · Esc: cancel link
        </p>
      </div>
    </aside>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
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
