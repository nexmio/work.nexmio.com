import { create } from "zustand";
import type { InlineCommand } from "@/bindings/InlineCommand";
import { api, toApiError } from "@/lib/api";
import { looksLikeDiagram, withDiagram } from "@/lib/diagram";
import { stripCodeFence } from "@/lib/fence";
import { flushPendingWrites } from "@/lib/flush";
import { wakeIfNeeded } from "@/lib/wake";
import { reportError, useUiStore } from "./uiStore";
import { useVaultStore } from "./vaultStore";

/** What an AI job does and for which text: everything it needs, so it can run while you work elsewhere. */
export interface AiJobSpec {
  /** The name of the command, for example "Fix spelling and grammar". */
  label: string;
  command: InlineCommand;
  instruction: string | null;
  /** The answer is only shown: nothing in the note changes. */
  answer: boolean;
  /** The answer is a Mermaid diagram that can be added under the text. */
  diagram: boolean;
  /** The selected text, the note it is in, and where it was. */
  text: string;
  notePath: string;
  from: number;
  to: number;
}

export type AiJobStatus = "queued" | "running" | "ready" | "failed";

export interface AiJob extends AiJobSpec {
  id: string;
  status: AiJobStatus;
  result: string;
  error: string | null;
  createdAt: number;
}

type Tab = "chat" | "tasks";

interface JobState {
  jobs: AiJob[];
  tab: Tab;
  setTab: (tab: Tab) => void;
  /** Puts a job last in the queue; the jobs run one at a time. */
  add: (spec: AiJobSpec) => string;
  /** Takes a job out of the queue (stops it when it runs), or clears a finished one. */
  remove: (id: string) => void;
  /** Opens the AI window on the tasks. */
  showTasks: () => void;
  /** Writes the result of a job into its note (the note is opened) and takes the job out. */
  accept: (id: string) => Promise<void>;
}

let counter = 1;

/** Finds the text in the note: where it was, or the only place it is. Null when it cannot be told. */
export function findSpot(
  content: string,
  text: string,
  from: number,
  to: number,
): { from: number; to: number } | null {
  if (content.slice(from, to) === text) return { from, to };
  const at = content.indexOf(text);
  if (at < 0 || content.indexOf(text, at + 1) >= 0) return null;
  return { from: at, to: at + text.length };
}

export const useAiJobStore = create<JobState>((set, get) => {
  /** The ids of the runs that were stopped, so a late answer is let go. */
  const taskIds = new Map<string, string>();
  const patch = (id: string, p: Partial<AiJob>): void => {
    set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...p } : j)) }));
  };
  const find = (id: string): AiJob | undefined => get().jobs.find((j) => j.id === id);

  const pump = (): void => {
    const { jobs } = get();
    if (jobs.some((j) => j.status === "running")) return;
    const next = jobs.find((j) => j.status === "queued");
    if (next) void run(next);
  };

  const finish = (id: string, p: Partial<AiJob>): void => {
    if (find(id)?.status !== "running") return;
    taskIds.delete(id);
    patch(id, p);
    const job = find(id);
    if (job) {
      useUiStore
        .getState()
        .toast(
          job.status === "ready"
            ? `AI is ready: ${job.label}`
            : `AI could not finish: ${job.label}`,
          job.status === "ready" ? "success" : "error",
          {
            label: "Open",
            run: () => {
              get().showTasks();
            },
          },
        );
    }
    pump();
  };

  const run = async (job: AiJob): Promise<void> => {
    patch(job.id, { status: "running", error: null });
    let raw = "";
    try {
      // A built-in AI that is not loaded is loaded first, so nobody has to press Load AI.
      const waking = await wakeIfNeeded();
      if (find(job.id)?.status !== "running") return;
      if (waking !== null) {
        finish(job.id, { status: "failed", error: waking });
        return;
      }
      const taskId = await api.aiInline(
        {
          command: job.command,
          instruction: job.instruction,
          text: job.text,
          notePath: job.notePath,
          providerId: null,
        },
        (e) => {
          if (find(job.id)?.status !== "running") return;
          if (e.type === "textDelta") {
            raw += e.text;
          } else if (e.type === "error") {
            finish(job.id, { status: "failed", error: e.error.message });
          } else if (e.type === "done") {
            const text = stripCodeFence(raw).trim();
            if (job.diagram && !looksLikeDiagram(text)) {
              finish(job.id, {
                status: "failed",
                error: "The AI did not answer with a diagram. Try again.",
              });
            } else finish(job.id, { status: "ready", result: text });
          }
        },
      );
      if (find(job.id)?.status === "running") taskIds.set(job.id, taskId);
      else void api.aiCancel(taskId).catch(() => undefined);
    } catch (e) {
      finish(job.id, { status: "failed", error: toApiError(e).message });
    }
  };

  return {
    jobs: [],
    tab: "chat",
    setTab: (tab) => {
      set({ tab });
    },
    add: (spec) => {
      const id = `job${String(counter++)}`;
      set((s) => ({
        jobs: [
          ...s.jobs,
          { ...spec, id, status: "queued", result: "", error: null, createdAt: Date.now() },
        ],
      }));
      const ahead = get().jobs.filter((j) => j.status === "queued" || j.status === "running");
      useUiStore
        .getState()
        .toast(
          ahead.length > 1
            ? `Added to the AI queue (${String(ahead.length - 1)} before it): ${spec.label}`
            : `The AI is on it: ${spec.label}`,
          "info",
          {
            label: "Open",
            run: () => {
              get().showTasks();
            },
          },
        );
      pump();
      return id;
    },
    remove: (id) => {
      const job = find(id);
      if (!job) return;
      const taskId = taskIds.get(id);
      taskIds.delete(id);
      set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
      if (taskId !== undefined) void api.aiCancel(taskId).catch(() => undefined);
      if (job.status === "running") pump();
    },
    showTasks: () => {
      set({ tab: "tasks" });
      useUiStore.getState().setAskOpen(true);
    },
    accept: async (id) => {
      const job = find(id);
      if (job?.status !== "ready") return;
      const replacement = job.diagram ? withDiagram(job.text, job.result) : job.result;
      const path = job.notePath;
      try {
        await flushPendingWrites();
        const note = await api.readNote(path);
        const spot = findSpot(note.content, job.text, job.from, job.to);
        if (spot === null) {
          useUiStore
            .getState()
            .toast("The text has changed since you asked, so the result was not written.", "error");
          return;
        }
        const next = note.content.slice(0, spot.from) + replacement + note.content.slice(spot.to);
        await api.commitNow({ kind: "snapshotBeforeAi", detail: `${job.label} in ${path}` }, [
          path,
        ]);
        await api.writeNote(path, next);
        await api.commitNow({ kind: "ai", detail: `${job.label} in ${path}` }, [path]);
        get().remove(id);
        const vault = useVaultStore.getState();
        if (vault.activePath === path) {
          useVaultStore.setState((s) => ({ reloadNonce: s.reloadNonce + 1 }));
        } else {
          await vault.openNote(path);
        }
        useUiStore.getState().toast(`Written in the page: ${job.label}`, "success");
      } catch (e) {
        reportError(e);
      }
    },
  };
});
