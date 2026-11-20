import type { ChangedPage } from "@/bindings/ChangedPage";
import type { Epic } from "@/bindings/Epic";
import type { Project } from "@/bindings/Project";
import type { Task } from "@/bindings/Task";
import { decisionsOf } from "@/lib/meeting";
import type { MeetingNote } from "@/lib/meetingList";
import { projectTag } from "@/lib/noteTags";
import { frontTags } from "@/lib/planTree";
import { isoDate } from "@/lib/taskLogic";
import { formatDuration, timeEntriesOf } from "@/lib/timeLog";
import { isInside } from "@/lib/utils";

/** A week: Monday to Sunday, `YYYY-MM-DD`, both included. */
export interface Week {
  from: string;
  to: string;
  /** The ISO week number. */
  number: number;
}

/** The week `offset` weeks from the one `now` is in (0 = this week, -1 = the week before). */
export function weekOf(offset: number, now: Date = new Date()): Week {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + offset * 7);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  // ISO week: the week with the year's first Thursday is week 1.
  const thursday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 3);
  const jan1 = new Date(thursday.getFullYear(), 0, 1);
  const number = Math.floor((thursday.getTime() - jan1.getTime()) / 86_400_000 / 7) + 1;
  return { from: isoDate(monday), to: isoDate(sunday), number };
}

/** The span of a week in seconds since the epoch (local time), for the page history. */
export function weekSeconds(w: Week): { from: number; to: number } {
  const at = (iso: string, days: number): number => {
    const [y, m, d] = iso.split("-").map(Number);
    return Math.floor(new Date(y ?? 0, (m ?? 1) - 1, (d ?? 1) + days).getTime() / 1000);
  };
  return { from: at(w.from, 0), to: at(w.to, 1) };
}

export interface DoneTask {
  task: Task;
  epic: string;
  date: string;
}

export interface MovedTask {
  task: Task;
  epic: string;
  /** The last change in the week, as the history says it ("Status: waiting"). */
  change: string;
}

export interface TimeByEpic {
  epic: string;
  minutes: number;
}

export interface WeekMeeting {
  meeting: MeetingNote;
  decisions: string[];
}

/** What happened in a week: read from the vault, nothing is stored. */
export interface LookBack {
  done: DoneTask[];
  moved: MovedTask[];
  time: TimeByEpic[];
  minutes: number;
  meetings: WeekMeeting[];
  pages: ChangedPage[];
}

export interface LookBackInput {
  week: Week;
  /** Days after it are not counted (this week ends today). */
  today: string;
  tasks: readonly Task[];
  epics: readonly Epic[];
  meetings: readonly MeetingNote[];
  pages: readonly ChangedPage[];
  /** Only this project: its folder, or its tag on the page, the epic or the task. */
  project: Project | null;
  /** Projects left out entirely (Local AI only, when the list goes to a cloud AI). */
  leaveOut?: readonly Project[];
}

const within = (date: string, from: string, to: string): boolean => date >= from && date <= to;

/** The week's work, the newest first in each list. */
export function lookBack(i: LookBackInput): LookBack {
  const to = i.today < i.week.to ? i.today : i.week.to;
  const from = i.week.from;
  const epicOf = new Map(i.epics.map((e) => [e.path, e]));
  const epicTitle = (t: Task): string =>
    epicOf.get(t.path)?.title ?? t.path.replace(/\.md$/, "").split("/").pop() ?? t.path;
  const tag = i.project === null ? null : projectTag(i.project);
  const out = i.leaveOut ?? [];
  const leftOut = (path: string, tags: readonly string[]): boolean =>
    out.some((p) => isInside(path, p.folder) || tags.includes(projectTag(p)));
  const ofProject = (path: string, tags: readonly string[]): boolean =>
    !leftOut(path, tags) &&
    (i.project === null ||
      isInside(path, i.project.folder) ||
      (tag !== null && tags.includes(tag)));
  const tasks = i.tasks.filter((t) =>
    ofProject(t.path, [...t.tags, ...(epicOf.get(t.path)?.tags ?? [])]),
  );

  const done: DoneTask[] = [];
  const moved: MovedTask[] = [];
  for (const t of tasks) {
    const inWeek = t.history.filter((h) => within(h.date, from, to));
    const last = inWeek[inWeek.length - 1];
    if (last === undefined) continue;
    if (t.done && last.text === "Done") done.push({ task: t, epic: epicTitle(t), date: last.date });
    else if (!t.done && last.text !== "Open again")
      moved.push({ task: t, epic: epicTitle(t), change: last.text });
  }
  done.sort((a, b) => b.date.localeCompare(a.date));

  const byEpic = new Map<string, number>();
  for (const e of tasks.flatMap(timeEntriesOf)) {
    if (!within(e.date, from, to)) continue;
    const name = epicTitle(e.task);
    byEpic.set(name, (byEpic.get(name) ?? 0) + e.minutes);
  }
  const time = [...byEpic].map(([epic, minutes]) => ({ epic, minutes }));
  time.sort((a, b) => b.minutes - a.minutes);

  const meetings = i.meetings
    .filter((m) => m.meeting.date !== null && within(m.meeting.date, from, to))
    .filter((m) => ofProject(m.path, frontTags(m.content)))
    .map((m) => ({ meeting: m, decisions: decisionsOf(m.content) }))
    .sort((a, b) =>
      `${b.meeting.meeting.date ?? ""} ${b.meeting.meeting.time ?? ""}`.localeCompare(
        `${a.meeting.meeting.date ?? ""} ${a.meeting.meeting.time ?? ""}`,
      ),
    );

  const pages = i.pages.filter(
    (p) => !leftOut(p.path, []) && (i.project === null || isInside(p.path, i.project.folder)),
  );

  return {
    done,
    moved,
    time,
    minutes: time.reduce((n, t) => n + t.minutes, 0),
    meetings,
    pages,
  };
}

/** True when nothing happened in the week. */
export function isEmpty(l: LookBack): boolean {
  return l.done.length + l.moved.length + l.time.length + l.meetings.length + l.pages.length === 0;
}

/** "Status: waiting" → "now waiting"; "Waiting for: Mette" → "waiting for Mette". */
export function changeText(change: string): string {
  const status = /^Status:\s*(.+)$/i.exec(change);
  if (status) return `now ${(status[1] ?? "").trim()}`;
  const waiting = /^Waiting for(?: the task)?:\s*(.+)$/i.exec(change);
  if (waiting) return `waiting for ${(waiting[1] ?? "").trim()}`;
  return change;
}

const dayMonth = (iso: string): string => {
  const [, m, d] = iso.split("-").map(Number);
  return `${String(d)}/${String(m)}`;
};

/** The week as a status report in Markdown: the headings are fixed, the lines are the user's. */
export function reportMarkdown(l: LookBack, week: Week, project: Project | null): string {
  const out = [
    `## Week ${String(week.number)} (${dayMonth(week.from)}–${dayMonth(week.to)})${project ? ` · ${project.name}` : ""}`,
  ];
  const section = (title: string, lines: string[]): void => {
    if (lines.length > 0) out.push("", `### ${title}`, ...lines.map((x) => `- ${x}`));
  };
  section(
    "Done",
    l.done.map((d) => `${d.task.title} (${d.epic})`),
  );
  section(
    "Moved on",
    l.moved.map((m) => `${m.task.title}: ${changeText(m.change)} (${m.epic})`),
  );
  section(
    "Time",
    l.time.map((t) => `${t.epic}: ${formatDuration(t.minutes)}`),
  );
  section(
    "Decided",
    l.meetings.flatMap((m) => m.decisions.map((d) => `${d} (${m.meeting.meeting.title})`)),
  );
  section(
    "Meetings",
    l.meetings.map((m) => `${m.meeting.meeting.title}, ${m.meeting.meeting.date ?? ""}`),
  );
  section(
    "Pages",
    l.pages.map(
      (p) => `${p.path.replace(/\.md$/, "").split("/").pop() ?? p.path}${p.new ? " (new)" : ""}`,
    ),
  );
  if (out.length === 1) out.push("", "Nothing was recorded this week.");
  return out.join("\n") + "\n";
}
