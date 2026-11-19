import type { Task } from "@/bindings/Task";
import { isoDate } from "@/lib/taskLogic";

/** A timer that has run is one line in the task's log, starting with this mark. */
export const TIME_PREFIX = "⏱ ";

/** `1 h 20 min`, `45 min` or `2 h`: whole minutes, at least one. */
export function formatDuration(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${String(r)} min`;
  if (r === 0) return `${String(h)} h`;
  return `${String(h)} h ${String(r).padStart(2, "0")} min`;
}

/** `00:42:10` from milliseconds, for the clock of a running timer. */
export function clockText(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

/** Whole minutes between two moments, at least one (a timer that ran is never zero). */
export function minutesBetween(startMs: number, endMs: number): number {
  return Math.max(1, Math.round((endMs - startMs) / 60_000));
}

/** `09:40` of a moment, in the computer's own time. */
export function hourMinute(ms: number): string {
  const d = new Date(ms);
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * The log line for a timer that ran: `⏱ 1 h 20 min · 09:00–10:20 · what was done`. The day is the
 * date of the log line itself. It is ordinary text, so it reads the same in any editor.
 */
export function timeLogText(args: {
  minutes: number;
  from: number;
  to: number;
  note?: string;
}): string {
  const parts = [
    `${TIME_PREFIX}${formatDuration(args.minutes)}`,
    `${hourMinute(args.from)}–${hourMinute(args.to)}`,
  ];
  const note = args.note?.trim().replace(/\s+/g, " ") ?? "";
  if (note !== "") parts.push(note);
  return parts.join(" · ");
}

/** What a time line says: how long, when in the day (if written), and the note after it. */
export interface TimeLine {
  minutes: number;
  /** `09:00–10:20`, or null when the line has no times. */
  span: string | null;
  note: string;
}

const DURATION_RE = /^(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?$/;

/** Reads a log line's text as a time line, or null when it is not one. */
export function parseTimeLine(text: string): TimeLine | null {
  if (!text.startsWith(TIME_PREFIX)) return null;
  const [duration = "", ...rest] = text.slice(TIME_PREFIX.length).split(" · ");
  const m = DURATION_RE.exec(duration.trim());
  if (m === null || (m[1] === undefined && m[2] === undefined)) return null;
  const minutes = Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
  if (minutes <= 0) return null;
  const first = rest[0] ?? "";
  const hasSpan = /^\d{2}:\d{2}–\d{2}:\d{2}$/.test(first);
  return {
    minutes,
    span: hasSpan ? first : null,
    note: (hasSpan ? rest.slice(1) : rest).join(" · ").trim(),
  };
}

/** One registration of time on a task. */
export interface TimeEntry extends TimeLine {
  task: Task;
  /** `YYYY-MM-DD`. */
  date: string;
}

/** The time registrations written in a task's log, oldest first. */
export function timeEntriesOf(task: Task): TimeEntry[] {
  const out: TimeEntry[] = [];
  for (const l of task.log) {
    const t = parseTimeLine(l.text);
    if (t !== null) out.push({ ...t, task, date: l.date });
  }
  return out;
}

/** All the minutes registered on a task. */
export function taskMinutes(task: Task): number {
  return timeEntriesOf(task).reduce((n, e) => n + e.minutes, 0);
}

/** The periods the time overview can be narrowed to. */
export type Period = "week" | "month" | "last-month" | "year" | "all";

export const PERIODS: { id: Period; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "year", label: "This year" },
  { id: "all", label: "All time" },
];

/** The first and last day (`YYYY-MM-DD`, both included) of a period, or null for all time. */
export function periodRange(period: Period, now: Date = new Date()): [string, string] | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (period) {
    case "week": {
      const monday = new Date(y, m, now.getDate() - ((now.getDay() + 6) % 7));
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
      return [isoDate(monday), isoDate(sunday)];
    }
    case "month":
      return [isoDate(new Date(y, m, 1)), isoDate(new Date(y, m + 1, 0))];
    case "last-month":
      return [isoDate(new Date(y, m - 1, 1)), isoDate(new Date(y, m, 0))];
    case "year":
      return [`${String(y)}-01-01`, `${String(y)}-12-31`];
    case "all":
      return null;
  }
}

/** The entries of a period (all of them for `null`). */
export function entriesIn<T extends { date: string }>(
  entries: readonly T[],
  range: [string, string] | null,
): T[] {
  if (range === null) return [...entries];
  return entries.filter((e) => e.date >= range[0] && e.date <= range[1]);
}

/** The entries as CSV for a spreadsheet: date, task, epic, tags, time of day, minutes, note. */
export function timeCsv(
  rows: readonly {
    date: string;
    task: string;
    epic: string;
    tags: string;
    span: string | null;
    minutes: number;
    note: string;
  }[],
): string {
  const cell = (v: string): string => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = ["Date", "Task", "Epic", "Tags", "Time of day", "Minutes", "Note"];
  const lines = rows.map((r) =>
    [r.date, r.task, r.epic, r.tags, r.span ?? "", String(r.minutes), r.note].map(cell).join(","),
  );
  return [head.join(","), ...lines].join("\n");
}
