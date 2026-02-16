import type { Note } from "./note";

export interface Connection {
  id: string;
  fromNoteId: string;
  toNoteId: string;
}

/**
 * A wall (workspace) containing notes and connections. Persisted per id.
 */
export interface Wall {
  id: string;
  name: string;
  theme: ThemeId;
  notes: Note[];
  connections: Connection[];
  createdAt: number;
  updatedAt: number;
}

export type ThemeId = "skyblue";

export const DEFAULT_WALL_NAME = "My Wall";
