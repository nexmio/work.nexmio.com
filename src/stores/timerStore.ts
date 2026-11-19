import { create } from "zustand";
import type { Task } from "@/bindings/Task";
import { taskText } from "@/lib/taskLogic";
import { minutesBetween, timeLogText } from "@/lib/timeLog";
import { findTask, useTaskStore } from "./taskStore";
import { reportError, useUiStore } from "./uiStore";
import { useVaultStore } from "./vaultStore";

/** The timer that is running: which task and when it started. */
export interface RunningTimer {
  path: string;
  line: number;
  title: string;
  /** When it started, in milliseconds. */
  startedAt: number;
}

interface TimerState {
  running: RunningTimer | null;
  /** Reads the timer of the open vault again (when a vault is opened). */
  restore: () => void;
  /** Starts a timer on a task. A timer that is running is stopped first, and its time written. */
  start: (task: Task) => Promise<void>;
  /** Makes a task in an epic and starts a timer on it. */
  startNew: (args: { title: string; epicPath: string }) => Promise<boolean>;
  /** Stops the timer and writes one line in the task's log. Resolves to whether it was written. */
  stop: (note?: string) => Promise<boolean>;
  /** Drops the timer without writing anything. */
  discard: () => void;
}

const keyOf = (): string => `nexmio.timer:${useVaultStore.getState().vault?.path ?? ""}`;

function read(): RunningTimer | null {
  try {
    const raw = localStorage.getItem(keyOf());
    if (raw === null) return null;
    const v = JSON.parse(raw) as Partial<RunningTimer>;
    if (
      typeof v.path === "string" &&
      typeof v.line === "number" &&
      typeof v.title === "string" &&
      typeof v.startedAt === "number"
    ) {
      return {
        path: v.path,
        line: v.line,
        title: v.title,
        startedAt: v.startedAt,
      };
    }
  } catch {
    /* an unreadable timer is just no timer */
  }
  return null;
}

function write(t: RunningTimer | null): void {
  try {
    if (t === null) localStorage.removeItem(keyOf());
    else localStorage.setItem(keyOf(), JSON.stringify(t));
  } catch {
    /* the timer then only lives while the app is open */
  }
}

export const useTimerStore = create<TimerState>((set, get) => ({
  running: read(),
  restore: () => {
    set({ running: read() });
  },
  start: async (task) => {
    if (get().running !== null) await get().stop();
    const running: RunningTimer = {
      path: task.path,
      line: task.line,
      title: task.title,
      startedAt: Date.now(),
    };
    write(running);
    set({ running });
    // The timer is in the right panel, so a page can be written while it runs.
    useUiStore.getState().setRightTab("timer");
  },
  startNew: async ({ title, epicPath }) => {
    const text = taskText(title);
    if (text === "") return false;
    await useTaskStore.getState().add(text, undefined, undefined, epicPath);
    const made = useTaskStore
      .getState()
      .tasks.filter((t) => t.path === epicPath && t.title === text)
      .sort((a, b) => b.line - a.line)[0];
    if (made === undefined) {
      reportError("The task could not be made, so the timer was not started.");
      return false;
    }
    await get().start(made);
    return true;
  },
  stop: async (note) => {
    const running = get().running;
    if (running === null) return false;
    const to = Date.now();
    const tasks = useTaskStore.getState().tasks;
    const task = findTask(tasks, running);
    write(null);
    set({ running: null });
    if (task === null) {
      useUiStore
        .getState()
        .toast("The task is no longer there, so the time was not written in a log.", "error");
      return false;
    }
    const minutes = minutesBetween(running.startedAt, to);
    await useTaskStore
      .getState()
      .addLog(task, timeLogText({ minutes, from: running.startedAt, to, note }));
    return true;
  },
  discard: () => {
    write(null);
    set({ running: null });
  },
}));
