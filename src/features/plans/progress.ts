import type { Epic } from "@/bindings/Epic";
import type { Task } from "@/bindings/Task";

/** The epics made for a plan: their page points back at the plan (`source`). */
export function epicsOfPlan(
  planPath: string,
  epics: readonly Pick<Epic, "path" | "source">[],
  resolve: (target: string) => string | null,
): string[] {
  return epics
    .filter((e) => e.source !== null && resolve(e.source) === planPath)
    .map((e) => e.path);
}

/** The tasks of a plan: the tasks in the epics made for it (dropped ones left out). */
export function tasksOfPlan(
  planPath: string,
  tasks: readonly Task[],
  epics: readonly Pick<Epic, "path" | "source">[],
  resolve: (target: string) => string | null,
): Task[] {
  const paths = new Set(epicsOfPlan(planPath, epics, resolve));
  return tasks.filter((t) => paths.has(t.path) && t.status !== "dropped");
}

/** How far a plan has come: its tasks done of all. */
export function planProgress(tasks: readonly Task[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.done).length, total: tasks.length };
}
