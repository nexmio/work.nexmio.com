import type { Epic } from "@/bindings/Epic";
import type { Task } from "@/bindings/Task";
import { taskMinutes } from "@/lib/timeLog";

/** One step of "Get started": what to do, and whether it is done (read from the vault). */
export interface StartStep {
  id: "plan" | "parts" | "task" | "timer" | "meeting";
  label: string;
  done: boolean;
}

/** What "Get started" looks at, all of it already read by the start page's stores. */
export interface StartFacts {
  plans: readonly { path: string; ideas: number }[];
  tasks: readonly Task[];
  epics: readonly Pick<Epic, "path" | "source">[];
  meetings: number;
  /** Turns a link target (an epic's `source`) into a page path, or null. */
  resolve: (target: string) => string | null;
}

/**
 * The five steps of "Get started", each done when the vault shows it: a plan, a plan with two
 * parts or more, a task in an epic made for a plan, a task with time on it, a meeting.
 */
export function startSteps(f: StartFacts): StartStep[] {
  const planPaths = new Set(f.plans.map((p) => p.path));
  const planEpics = new Set(
    f.epics
      .filter((e) => e.source !== null && planPaths.has(f.resolve(e.source) ?? ""))
      .map((e) => e.path),
  );
  return [
    { id: "plan", label: "Make a plan", done: f.plans.length > 0 },
    { id: "parts", label: "Break it into parts", done: f.plans.some((p) => p.ideas >= 2) },
    {
      id: "task",
      label: "Make a task of a part",
      done: f.tasks.some((t) => planEpics.has(t.path)),
    },
    {
      id: "timer",
      label: "Start a timer on a task",
      done: f.tasks.some((t) => taskMinutes(t) > 0),
    },
    { id: "meeting", label: "Write a meeting", done: f.meetings > 0 },
  ];
}
