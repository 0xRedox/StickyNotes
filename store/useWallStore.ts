"use client";

import { create } from "zustand";
import type { Wall, ThemeId } from "@/types/wall";
import type { Note } from "@/types/note";
import { DEFAULT_NOTE, NOTE_COLORS } from "@/types/note";
import { DEFAULT_WALL_NAME } from "@/types/wall";
import type { Connection } from "@/types/wall";
import { loadFromStorage, saveToStorage } from "@/utils/localStorage";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function createEmptyWall(theme: ThemeId = "skyblue"): Wall {
  const now = Date.now();
  return {
    id: generateId(),
    name: DEFAULT_WALL_NAME,
    theme,
    notes: [],
    connections: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createNote(wallId: string, x: number, y: number, color?: string, date?: string): Note {
  const now = Date.now();
  return {
    id: generateId(),
    wallId,
    content: "",
    color: color ?? NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
    x,
    y,
    width: DEFAULT_NOTE.width,
    height: DEFAULT_NOTE.height,
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    ...(date && { date }),
  };
}

interface WallState {
  walls: Wall[];
  activeWallId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // Wall zoom (UI only, not persisted in walls)
  zoom: number;
  setZoom: (zoom: number) => void;
  // Actions
  hydrate: () => void;
  persist: () => void;
  setActiveWall: (id: string | null) => void;
  createWall: (name?: string, theme?: ThemeId) => Wall;
  updateWall: (id: string, patch: Partial<Pick<Wall, "name" | "theme">>) => void;
  deleteWall: (id: string) => void;
  getActiveWall: () => Wall | null;
  // Notes
  addNote: (wallId: string, x: number, y: number, color?: string, date?: string) => Note;
  updateNote: (wallId: string, noteId: string, patch: Partial<Note>) => void;
  deleteNote: (wallId: string, noteId: string) => void;
  moveNote: (wallId: string, noteId: string, x: number, y: number) => void;
  resizeNote: (wallId: string, noteId: string, width: number, height: number) => void;
  togglePinNote: (wallId: string, noteId: string) => void;
  toggleCheckNote: (wallId: string, noteId: string) => void;
  duplicateNote: (wallId: string, noteId: string) => Note | null;
  connectionFromNoteId: string | null;
  setConnectionFromNoteId: (id: string | null) => void;
  addConnection: (wallId: string, fromNoteId: string, toNoteId: string) => void;
  removeConnection: (wallId: string, connectionId: string) => void;
  exportWallAsJson: (wallId: string) => string;
  importWall: (json: string) => Wall | null;
  // UI Transient State
  tempConnection: { fromNoteId: string; toX: number; toY: number } | null;
  setTempConnection: (temp: { fromNoteId: string; toX: number; toY: number } | null) => void;
}

export const useWallStore = create<WallState>((set, get) => ({
  walls: [],
  activeWallId: null,
  searchQuery: "",
  setSearchQuery(q) {
    set({ searchQuery: q });
  },
   zoom: 1,
   setZoom(zoom) {
     const clamped = Math.min(2, Math.max(0.25, zoom));
     set({ zoom: clamped });
   },
  connectionFromNoteId: null,
  tempConnection: null,
  setTempConnection(temp) {
    set({ tempConnection: temp });
  },

  hydrate() {
    const data = loadFromStorage();
    if (data?.walls?.length) {
      const walls = data.walls.map((w) => ({
        ...w,
        theme: "skyblue" as ThemeId,
        connections: Array.isArray(w.connections) ? w.connections : [],
      }));
      set({ walls, activeWallId: data.activeWallId ?? data.walls[0]?.id ?? null });
    } else {
      const first = createEmptyWall();
      set({ walls: [first], activeWallId: first.id });
    }
  },

  persist() {
    const { walls, activeWallId } = get();
    saveToStorage({ walls, activeWallId });
  },

  setActiveWall(id) {
    set({ activeWallId: id });
    get().persist();
  },

  createWall(name, theme = "skyblue") {
    const wall = createEmptyWall(theme);
    if (name) wall.name = name;
    set((s) => ({ walls: [...s.walls, wall], activeWallId: wall.id }));
    get().persist();
    return wall;
  },

  updateWall(id, patch) {
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === id ? { ...w, ...patch, updatedAt: Date.now() } : w
      ),
    }));
    get().persist();
  },

  deleteWall(id) {
    const { walls, activeWallId } = get();
    const next = walls.filter((w) => w.id !== id);
    const nextActive =
      activeWallId === id ? (next[0]?.id ?? null) : activeWallId;
    set({ walls: next, activeWallId: nextActive });
    get().persist();
  },

  getActiveWall() {
    const { walls, activeWallId } = get();
    return walls.find((w) => w.id === activeWallId) ?? null;
  },

  addNote(wallId, x, y, color, date) {
    const note = createNote(wallId, x, y, color, date);
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? { ...w, notes: [...w.notes, note], updatedAt: Date.now() }
          : w
      ),
    }));
    get().persist();
    return note;
  },

  updateNote(wallId, noteId, patch) {
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? {
            ...w,
            notes: w.notes.map((n) =>
              n.id === noteId ? { ...n, ...patch, updatedAt: Date.now() } : n
            ),
            updatedAt: Date.now(),
          }
          : w
      ),
    }));
    get().persist();
  },

  deleteNote(wallId, noteId) {
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? {
            ...w,
            notes: w.notes.filter((n) => n.id !== noteId),
            connections: (w.connections ?? []).filter(
              (c) => c.fromNoteId !== noteId && c.toNoteId !== noteId
            ),
            updatedAt: Date.now(),
          }
          : w
      ),
    }));
    if (get().connectionFromNoteId === noteId) set({ connectionFromNoteId: null });
    get().persist();
  },

  moveNote(wallId, noteId, x, y) {
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? {
            ...w,
            notes: w.notes.map((n) =>
              n.id === noteId ? { ...n, x, y, updatedAt: Date.now() } : n
            ),
            updatedAt: Date.now(),
          }
          : w
      ),
    }));
    get().persist();
  },

  resizeNote(wallId, noteId, width, height) {
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? {
            ...w,
            notes: w.notes.map((n) =>
              n.id === noteId
                ? { ...n, width, height, updatedAt: Date.now() }
                : n
            ),
            updatedAt: Date.now(),
          }
          : w
      ),
    }));
    get().persist();
  },

  togglePinNote(wallId, noteId) {
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? {
            ...w,
            notes: w.notes.map((n) =>
              n.id === noteId
                ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() }
                : n
            ),
            updatedAt: Date.now(),
          }
          : w
      ),
    }));
    get().persist();
  },

  toggleCheckNote(wallId, noteId) {
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? {
            ...w,
            notes: w.notes.map((n) =>
              n.id === noteId
                ? { ...n, checked: !n.checked, updatedAt: Date.now() }
                : n
            ),
            updatedAt: Date.now(),
          }
          : w
      ),
    }));
    get().persist();
  },

  duplicateNote(wallId, noteId) {
    const wall = get().walls.find((w) => w.id === wallId);
    const note = wall?.notes.find((n) => n.id === noteId);
    if (!wall || !note) return null;
    const newNote: Note = {
      ...note,
      id: generateId(),
      x: note.x + 24,
      y: note.y + 24,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? { ...w, notes: [...w.notes, newNote], updatedAt: Date.now() }
          : w
      ),
    }));
    get().persist();
    return newNote;
  },

  setConnectionFromNoteId(id) {
    set({ connectionFromNoteId: id });
  },

  addConnection(wallId, fromNoteId, toNoteId) {
    if (fromNoteId === toNoteId) return;
    const wall = get().walls.find((w) => w.id === wallId);
    const connections = wall?.connections ?? [];
    const exists = connections.some(
      (c) =>
        (c.fromNoteId === fromNoteId && c.toNoteId === toNoteId) ||
        (c.fromNoteId === toNoteId && c.toNoteId === fromNoteId)
    );
    if (exists) {
      set({ connectionFromNoteId: null });
      return;
    }
    const conn: Connection = {
      id: generateId(),
      fromNoteId,
      toNoteId,
    };
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? { ...w, connections: [...(w.connections ?? []), conn], updatedAt: Date.now() }
          : w
      ),
      connectionFromNoteId: null,
    }));
    get().persist();
  },

  removeConnection(wallId, connectionId) {
    set((s) => ({
      walls: s.walls.map((w) =>
        w.id === wallId
          ? {
            ...w,
            connections: (w.connections ?? []).filter((c) => c.id !== connectionId),
            updatedAt: Date.now(),
          }
          : w
      ),
    }));
    get().persist();
  },

  exportWallAsJson(wallId) {
    const wall = get().walls.find((w) => w.id === wallId);
    return wall ? JSON.stringify(wall, null, 2) : "";
  },

  importWall(json) {
    try {
      const data = JSON.parse(json) as Wall;
      const oldToNewNoteId = new Map<string, string>();
      const newNotes: Note[] = (data.notes ?? []).map((n) => {
        const newId = generateId();
        oldToNewNoteId.set(n.id, newId);
        return {
          ...n,
          id: newId,
          wallId: "", // set below
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      });
      const newConnections: Connection[] = (data.connections ?? [])
        .map((c) => {
          const from = oldToNewNoteId.get(c.fromNoteId);
          const to = oldToNewNoteId.get(c.toNoteId);
          if (!from || !to) return null;
          return { id: generateId(), fromNoteId: from, toNoteId: to };
        })
        .filter((c): c is Connection => c !== null);
      const newWallId = generateId();
      const newWall: Wall = {
        ...data,
        id: newWallId,
        name: (data.name || "Imported Wall") + " (imported)",
        notes: newNotes.map((n) => ({ ...n, wallId: newWallId })),
        connections: newConnections,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((s) => ({ walls: [...s.walls, newWall], activeWallId: newWall.id }));
      get().persist();
      return newWall;
    } catch {
      return null;
    }
  },
}));
