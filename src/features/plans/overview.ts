import type { Epic } from "@/bindings/Epic";
import type { Task } from "@/bindings/Task";
import { decisionsOf } from "@/lib/meeting";
import type { MeetingNote } from "@/lib/meetingList";
import { frontTags } from "@/lib/planTree";
import { areaLists } from "@/lib/taskLogic";
import { timeEntriesOf } from "@/lib/timeLog";
import { isInside } from "@/lib/utils";
import { planProgress, tasksOfPlan } from "./progress";

/** What the Overview of a project is made from: everything is read, nothing is copied. */
export interface OverviewInput {
  planPath: string;
  /** The project's folder, or null for a plan in no project. */
  folder: string | null;
  /** The project's tag (the plan's own for a plan in no project). */
  tag: string;
  tasks: readonly Task[];
  epics: readonly Pick<Epic, "path" | "source">[];
  resolve: (target: string) => string | null;
  meetings: readonly MeetingNote[];
  /** Every page with when it was last changed (ms). */
  files: ReadonlyMap<string, number>;
  /** `YYYY-MM-DD`. */
  today: string;
}

export interface Decision {
  text: string;
  meeting: MeetingNote;
}

export interface ProjectOverview {
  done: number;
  total: number;
  now: Task | null;
  waiting: Task[];
  /** Minutes logged this month on the plan's tasks. */
  minutesThisMonth: number;
  next: MeetingNote | null;
  /** The last meetings before today, the latest first (at most three). */
  past: MeetingNote[];
  /** The decisions of the project's meetings, the newest first. */
  decisions: Decision[];
  /** The newest pages in the project's folder (at most five), the plan and meetings left out. */
  pages: { path: string; modified: number }[];
}

/** A meeting of the project: it has the project's tag, or it is in the project's folder. */
export function inProject(m: MeetingNote, tag: string, folder: string | null): boolean {
  return frontTags(m.content).includes(tag) || (folder !== null && isInside(m.path, folder));
}

/** The meetings of a project that come, nearest first; and those that were, the latest first. */
function split(meetings: readonly MeetingNote[], today: string) {
  const dated = meetings.filter((m) => m.meeting.date !== null);
  const key = (m: MeetingNote): string => `${m.meeting.date ?? ""} ${m.meeting.time ?? ""}`;
  const coming = dated
    .filter((m) => (m.meeting.date ?? "") >= today)
    .sort((a, b) => key(a).localeCompare(key(b)));
  const past = dated
    .filter((m) => (m.meeting.date ?? "") < today)
    .sort((a, b) => key(b).localeCompare(key(a)));
  return { coming, past };
}

/** The Overview of a project: how far its plan has come, its meetings, decisions and pages. */
export function projectOverview(i: OverviewInput): ProjectOverview {
  const tasks = tasksOfPlan(i.planPath, i.tasks, i.epics, i.resolve);
  const { done, total } = planProgress(tasks);
  const lists = areaLists(tasks);
  const month = i.today.slice(0, 7);
  const minutesThisMonth = tasks
    .flatMap(timeEntriesOf)
    .filter((e) => e.date.startsWith(month))
    .reduce((n, e) => n + e.minutes, 0);
  const own = i.meetings.filter((m) => inProject(m, i.tag, i.folder));
  const { coming, past } = split(own, i.today);
  const decisions = [...own]
    .sort((a, b) => (b.meeting.date ?? "").localeCompare(a.meeting.date ?? ""))
    .flatMap((m) => decisionsOf(m.content).map((text) => ({ text, meeting: m })));
  const meetingPaths = new Set(i.meetings.map((m) => m.path));
  const pages =
    i.folder === null
      ? []
      : [...i.files.entries()]
          .filter(
            ([p]) =>
              isInside(p, i.folder ?? "") &&
              p.toLowerCase().endsWith(".md") &&
              p !== i.planPath &&
              !meetingPaths.has(p),
          )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([path, modified]) => ({ path, modified }));
  return {
    done,
    total,
    now: lists.now,
    waiting: lists.waiting,
    minutesThisMonth,
    next: coming[0] ?? null,
    past: past.slice(0, 3),
    decisions,
    pages,
  };
}
