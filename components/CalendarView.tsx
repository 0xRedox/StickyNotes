"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallStore } from "@/store/useWallStore";
import { getTheme } from "@/lib/themes";
import type { Note } from "@/types/note";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: { date: Date; iso: string; isCurrentMonth: boolean }[] = [];
  const startPad = first.getDay();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevLast = new Date(prevYear, prevMonth + 1, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(prevYear, prevMonth, prevLast - i);
    days.push({ date: d, iso: d.toISOString().slice(0, 10), isCurrentMonth: false });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({ date, iso: date.toISOString().slice(0, 10), isCurrentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month, last.getDate() + i);
    days.push({ date, iso: date.toISOString().slice(0, 10), isCurrentMonth: false });
  }
  return days;
}

function getWeekDays(year: number, month: number) {
  const mid = new Date(year, month, 15);
  const day = mid.getDay();
  const start = new Date(mid);
  start.setDate(mid.getDate() - day);
  const week: { date: Date; iso: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push({ date: d, iso: d.toISOString().slice(0, 10) });
  }
  return week;
}

type CalendarViewMode = "month" | "week" | "agenda";

export function CalendarView() {
  const wall = useWallStore((s) => s.getActiveWall());
  const addNote = useWallStore((s) => s.addNote);
  const updateNote = useWallStore((s) => s.updateNote);
  const deleteNote = useWallStore((s) => s.deleteNote);
  const theme = getTheme("skyblue");

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const days = useMemo(
    () => getDaysInMonth(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month]
  );

  const weekDays = useMemo(
    () => getWeekDays(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month]
  );

  const notesByDate = useMemo(() => {
    if (!wall) return new Map<string, Note[]>();
    const map = new Map<string, Note[]>();
    for (const note of wall.notes) {
      if (!note.date) continue;
      const list = map.get(note.date) ?? [];
      list.push(note);
      map.set(note.date, list);
    }
    return map;
  }, [wall]);

  const agendaDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const list: { date: Date; iso: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      list.push({ date: d, iso: d.toISOString().slice(0, 10) });
    }
    return list;
  }, []);

  const goToToday = () => {
    const d = new Date();
    setViewDate({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  };

  const prev = () => {
    if (calendarViewMode === "week") {
      const d = new Date(weekDays[0].date);
      d.setDate(d.getDate() - 7);
      setViewDate({ year: d.getFullYear(), month: d.getMonth() });
    } else {
      setViewDate((v) =>
        v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }
      );
    }
  };

  const next = () => {
    if (calendarViewMode === "week") {
      const d = new Date(weekDays[0].date);
      d.setDate(d.getDate() + 7);
      setViewDate({ year: d.getFullYear(), month: d.getMonth() });
    } else {
      setViewDate((v) =>
        v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }
      );
    }
  };

  const handleAddForDate = (iso: string) => {
    if (!wall) return;
    addNote(wall.id, 80, 80, undefined, iso);
    setSelectedDate(iso);
  };

  const selectedNotes = selectedDate ? notesByDate.get(selectedDate) ?? [] : [];
  const accent = theme.accent;
  const isToday = (iso: string) => {
    const t = new Date();
    const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    return iso === today;
  };

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => y - 5 + i);
  }, []);

  if (!wall) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-600">
        No wall selected.
      </div>
    );
  }

  const DayCell = ({
    iso,
    date,
    isCurrentMonth,
    notes,
    compact,
  }: {
    iso: string;
    date: Date;
    isCurrentMonth: boolean;
    notes: Note[];
    compact?: boolean;
  }) => (
    <motion.div
      layout
      className={`border-t border-slate-100 bg-white p-2 ${!isCurrentMonth ? "bg-slate-50/80 text-slate-400" : ""} ${compact ? "min-h-[70px]" : "min-h-[100px]"}`}
      onClick={() => setSelectedDate(iso)}
    >
      <div className="flex items-start justify-between">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium cursor-pointer ${
            isToday(iso) ? "text-white" : "text-slate-700"
          }`}
          style={isToday(iso) ? { backgroundColor: accent } : undefined}
        >
          {date.getDate()}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleAddForDate(iso);
          }}
          className="rounded p-1 hover:bg-slate-100"
          style={{ color: accent }}
          title="Add note"
        >
          <span className="text-lg leading-none">+</span>
        </button>
      </div>
      <div className="mt-1 space-y-1">
        <AnimatePresence mode="popLayout">
          {notes.slice(0, compact ? 2 : 3).map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded border-l-2 bg-slate-50/80 px-2 py-1 text-xs text-black"
              style={{ borderLeftColor: note.color }}
            >
              {note.content ? (
                <span className={note.checked ? "line-through opacity-70" : ""}>
                  {note.content.slice(0, compact ? 25 : 40)}
                  {note.content.length > (compact ? 25 : 40) ? "…" : ""}
                </span>
              ) : (
                <span className="italic text-black/60">No text</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {notes.length > (compact ? 2 : 3) && (
          <p className="text-[10px] text-black/60">+{notes.length - (compact ? 2 : 3)} more</p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-auto p-6">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <h2 className="font-display text-2xl font-bold text-slate-800">Calendar</h2>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={goToToday}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Today
                </button>
                <div className="flex rounded-lg border border-slate-200 p-0.5">
                  {(["month", "week", "agenda"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCalendarViewMode(mode)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium capitalize"
                      style={{
                        backgroundColor: calendarViewMode === mode ? accent + "22" : "transparent",
                        color: calendarViewMode === mode ? accent : "rgb(100 116 139)",
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prev}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  ←
                </button>
                <span className="font-display min-w-[180px] text-center text-lg font-semibold text-slate-800">
                  {calendarViewMode === "month" && `${MONTHS[viewDate.month]} ${viewDate.year}`}
                  {calendarViewMode === "week" &&
                    `${weekDays[0].date.getDate()}–${weekDays[6].date.getDate()} ${MONTHS[viewDate.month]} ${viewDate.year}`}
                  {calendarViewMode === "agenda" && "Next 14 days"}
                </span>
                <button
                  type="button"
                  onClick={next}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  →
                </button>
              </div>
              {calendarViewMode === "month" && (
                <div className="flex gap-1">
                  <select
                    value={viewDate.month}
                    onChange={(e) => setViewDate((v) => ({ ...v, month: Number(e.target.value) }))}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={viewDate.year}
                    onChange={(e) => setViewDate((v) => ({ ...v, year: Number(e.target.value) }))}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-sm"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {calendarViewMode === "month" && (
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="bg-white py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {d}
                  </div>
                ))}
                {days.map(({ date, iso, isCurrentMonth }) => (
                  <DayCell
                    key={iso}
                    iso={iso}
                    date={date}
                    isCurrentMonth={isCurrentMonth}
                    notes={notesByDate.get(iso) ?? []}
                  />
                ))}
              </div>
            )}

            {calendarViewMode === "week" && (
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
                {WEEKDAYS.map((d) => (
                  <div
                    key={d}
                    className="bg-white py-2 text-center text-xs font-semibold uppercase text-slate-500"
                  >
                    {d}
                  </div>
                ))}
                {weekDays.map(({ date, iso }) => (
                  <DayCell
                    key={iso}
                    iso={iso}
                    date={date}
                    isCurrentMonth={true}
                    notes={notesByDate.get(iso) ?? []}
                    compact
                  />
                ))}
              </div>
            )}

            {calendarViewMode === "agenda" && (
              <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                {agendaDays.map(({ date, iso }) => {
                  const notes = notesByDate.get(iso) ?? [];
                  return (
                    <div
                      key={iso}
                      className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className="font-medium"
                          style={isToday(iso) ? { color: accent } : { color: "#0f172a" }}
                        >
                          {date.toLocaleDateString(undefined, {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddForDate(iso)}
                          className="rounded px-2 py-1 text-sm font-medium hover:bg-slate-100"
                          style={{ color: accent }}
                        >
                          + Add note
                        </button>
                      </div>
                      {notes.length === 0 ? (
                        <p className="text-sm text-black/60">No notes</p>
                      ) : (
                        <ul className="space-y-2">
                          {notes.map((note) => (
                            <li
                              key={note.id}
                              className="flex items-start gap-2 rounded border-l-2 bg-slate-50/50 px-3 py-2"
                              style={{ borderLeftColor: note.color }}
                            >
                              {editingNoteId === note.id ? (
                                <input
                                  className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-sm text-black"
                                  defaultValue={note.content}
                                  onBlur={(e) => {
                                    updateNote(wall.id, note.id, { content: e.target.value });
                                    setEditingNoteId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      updateNote(wall.id, note.id, {
                                        content: (e.target as HTMLInputElement).value,
                                      });
                                      setEditingNoteId(null);
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <span
                                    className={`flex-1 text-sm text-black ${note.checked ? "line-through opacity-70" : ""}`}
                                  >
                                    {note.content || "No text"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoteId(note.id)}
                                    className="text-xs text-black hover:opacity-80"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteNote(wall.id, note.id)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Day detail panel */}
        <AnimatePresence>
          {selectedDate && calendarViewMode !== "agenda" && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex shrink-0 flex-col border-l border-slate-200 bg-slate-50/80"
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h3 className="font-display font-semibold text-black">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="rounded p-1 hover:bg-slate-200"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <button
                  type="button"
                  onClick={() => handleAddForDate(selectedDate)}
                  className="mb-4 w-full rounded-lg border-2 border-dashed px-4 py-3 text-sm font-medium"
                  style={{ borderColor: accent, color: accent }}
                >
                  + Add note for this day
                </button>
                {selectedNotes.length === 0 ? (
                  <p className="text-sm text-black/60">No notes on this day.</p>
                ) : (
                  <ul className="space-y-3">
                    {selectedNotes.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                      >
                        <div
                          className="mb-2 border-l-2 pl-2 text-sm"
                          style={{ borderLeftColor: note.color }}
                        >
                          {editingNoteId === note.id ? (
                            <input
                              className="w-full rounded border px-2 py-1 text-sm text-black"
                              defaultValue={note.content}
                              onBlur={(e) => {
                                updateNote(wall.id, note.id, { content: e.target.value });
                                setEditingNoteId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateNote(wall.id, note.id, {
                                    content: (e.target as HTMLInputElement).value,
                                  });
                                  setEditingNoteId(null);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <p className={`text-black ${note.checked ? "line-through opacity-70" : ""}`}>
                              {note.content || "No text"}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(editingNoteId === note.id ? null : note.id)}
                            className="text-black hover:opacity-80"
                          >
                            {editingNoteId === note.id ? "Done" : "Edit"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNote(wall.id, note.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                          <input
                            type="date"
                            value={note.date ?? ""}
                            onChange={(e) =>
                              updateNote(wall.id, note.id, { date: e.target.value || undefined })
                            }
                            className="rounded border border-slate-200 px-1 py-0.5 text-[10px] text-black"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
