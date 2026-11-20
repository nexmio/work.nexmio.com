import type { Task } from "@/bindings/Task";
import type { TaskHistory } from "@/bindings/TaskHistory";
import type { TaskLog } from "@/bindings/TaskLog";

/** How many of the latest log lines the status line is built from. */
export const STATUS_LOG_LINES = 10;
/** The log lines a status line is built from: the written ones, not Nexmio Work's own "Status:" lines. */
export function statusLogLines(task: Task): TaskLog[] {
  return task.log.filter((l) => !/^Status:\s/.test(l.text)).slice(-STATUS_LOG_LINES);
}
/** The facts the status line is written from. */
export function statusFacts(task: Task, stepsDone: number): string {
  return [
    `Task: ${task.title}`,
    task.status !== null ? `Status: ${task.status}` : "",
    task.steps.length > 0 ? `Steps: ${String(stepsDone)} of ${String(task.steps.length)} done` : "",
    task.note !== "" ? `Note: ${task.note}` : "",
    "Log (oldest first):",
    ...statusLogLines(task).map((l) => `${l.date} ${l.text}`),
  ]
    .filter((x) => x !== "")
    .join("\n");
}
/** The log of a task and its history in one list, newest first. */
export type Moment =
  { kind: "log"; entry: TaskLog } | { kind: "history"; entry: TaskHistory; at: number };
export function momentsOf(task: Pick<Task, "log" | "history">): Moment[] {
  const all: Moment[] = [
    ...[...task.log].reverse().map((entry): Moment => ({ kind: "log", entry })),
    ...[...task.history].reverse().map((entry, at): Moment => ({ kind: "history", entry, at })),
  ];
  // A stable sort: lines of the same day keep the order they were written in.
  return all.sort((a, b) => b.entry.date.localeCompare(a.entry.date));
}
