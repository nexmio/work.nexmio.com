import { create } from "zustand";
import type { InlineCommand } from "@/bindings/InlineCommand";
import type { InlineRequest } from "@/bindings/InlineRequest";
import { api, toApiError } from "@/lib/api";
import { looksLikeDiagram, withDiagram } from "@/lib/diagram";
import { stripCodeFence } from "@/lib/fence";
import { changeOpenPage } from "@/lib/editorViews";
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

/** What a "pick" job found: points to read (may be none) and things to tick. */
export interface AiPicks {
  points: string[];
  items: string[];
  /** Headings over parts of the list: `items[from]` up to `items[to - 1]` (Decisions, Actions). */
  groups?: { title: string; from: number; to: number }[];
}

/**
 * An AI job whose answer is a list to tick (parts of a plan, steps of a task, tasks in a page):
 * it is asked in the background, the list is shown in the Queue, and only the ticked items are
 * given to `add`. Nothing is written before.
 */
export interface AiPickSpec {
  /** The name of the job, for example "Suggest parts". */
  label: string;
  /** Where it was asked, shown under the name ("Move the office › Server"). */
  where: string;
  instruction: string;
  /** What the AI reads. It is read when the job starts, so it is the newest text. */
  read: () => Promise<string>;
  /** The page it is about (for the rules of its project), if any. */
  notePath: string | null;
  /** Makes the list from the answer. */
  parse: (answer: string) => AiPicks;
  /** What one and several items are called ("part", "parts"). */
  noun: [string, string];
  /** The end of the add button: "Add 3 parts" + " to the plan". */
  addTo: string;
  /** Adds the ticked items (the whole answer comes along, for a list in groups). */
  add: (chosen: string[], picks: AiPicks) => Promise<void>;
  /** Another way to ask ("Make the steps smaller"). */
  other?: { label: string; instruction: string };
  /** The first item is the one to start with. */
  firstIsStart?: boolean;
  /** The text "Copy" puts on the clipboard, when the answer can be copied. */
  copy?: (picks: AiPicks) => string;
  /** Goes back to where the job was asked. */
  goTo?: () => void;
  /**
   * The answer is a text to read, not a list (a status report): its paragraphs are the `points`,
   * shown under `title`, and `save` keeps it (for example as a new page).
   */
  text?: { title: string; save?: { label: string; run: (picks: AiPicks) => Promise<void> } };
}

interface JobBase {
  id: string;
  status: AiJobStatus;
  error: string | null;
  createdAt: number;
}

/** A command on selected text in a page: its result is written in the page when accepted. */
export interface EditJob extends JobBase, AiJobSpec {
  kind: "edit";
  result: string;
}

/** A job whose answer is a list to tick. */
export interface PickJob extends JobBase {
  kind: "pick";
  label: string;
  spec: AiPickSpec;
  /** The instruction this run uses (`spec.other` can change it). */
  instruction: string;
  picks: AiPicks | null;
}

export type AiJob = EditJob | PickJob;

/** A change to a job: the fields every job has, or those of its own kind. */
type JobPatch = Partial<Omit<EditJob, "kind">> | Partial<Omit<PickJob, "kind">>;

type Tab = "chat" | "tasks";

interface JobState {
  jobs: AiJob[];
  tab: Tab;
  setTab: (tab: Tab) => void;
  /** Puts a job on selected text last in the queue; the jobs run one at a time. */
  add: (spec: AiJobSpec) => string;
  /** Puts a job with a list to tick last in the queue. */
  addPick: (spec: AiPickSpec) => string;
  /** Asks a pick job again (with another instruction, if given). */
  again: (id: string, instruction?: string) => void;
  /** Takes a job out of the queue (stops it when it runs), or clears a finished one. */
  remove: (id: string) => void;
  /** Opens the AI window on the tasks. */
  showTasks: () => void;
  /** Goes back to where the job was asked (the page, the plan, the task). */
  goTo: (id: string) => void;
  /** Writes the result of a job into its note (the note is opened) and takes the job out. */
  accept: (id: string) => Promise<void>;
  /** Gives the ticked items of a pick job to its `add`, and takes the job out. */
  acceptPicks: (id: string, chosen: string[]) => Promise<void>;
}

let counter = 1;

/**
 * Runs what the person accepted between two saved versions: one of everything as it was, and one
 * with the change. The second is saved also when the change stops half way.
 */
async function betweenVersions(detail: string, change: () => Promise<void>): Promise<void> {
  await flushPendingWrites();
  await api.commitNow({ kind: "snapshotBeforeAi", detail });
  try {
    await change();
  } finally {
    await flushPendingWrites();
    await api.commitNow({ kind: "ai", detail });
  }
}

/**
 * Writes `next` in the page. Where the page is open it is changed there, as if typed, so Ctrl+Z
 * takes it back; otherwise (or if that did not reach the file) the file is written.
 * Returns whether the editor made the change.
 */
async function writeAccepted(
  path: string,
  before: string,
  spot: { from: number; to: number },
  replacement: string,
  next: string,
): Promise<boolean> {
  if (changeOpenPage(path, before, spot.from, spot.to, replacement)) {
    await flushPendingWrites();
    if ((await api.readNote(path)).content === next) return true;
  }
  await api.writeNote(path, next);
  return false;
}

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
  /** Changes some fields of a job (only fields of its own kind are given). */
  const patch = (id: string, p: JobPatch): void => {
    set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? ({ ...j, ...p } as AiJob) : j)) }));
  };
  const find = (id: string): AiJob | undefined => get().jobs.find((j) => j.id === id);

  const pump = (): void => {
    const { jobs } = get();
    if (jobs.some((j) => j.status === "running")) return;
    const next = jobs.find((j) => j.status === "queued");
    if (next) void run(next);
  };

  const finish = (id: string, p: JobPatch): void => {
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

  /** What is sent for a job: the selected text, or what a pick job reads when it starts. */
  const request = async (job: AiJob): Promise<InlineRequest> =>
    job.kind === "edit"
      ? {
          command: job.command,
          instruction: job.instruction,
          text: job.text,
          notePath: job.notePath,
          providerId: null,
        }
      : {
          command: "custom",
          instruction: job.instruction,
          text: await job.spec.read(),
          notePath: job.spec.notePath,
          providerId: null,
        };

  /** What a finished answer makes of the job. */
  const outcome = (job: AiJob, raw: string): JobPatch => {
    const text = stripCodeFence(raw).trim();
    if (job.kind === "pick") {
      return { status: "ready", picks: job.spec.parse(text) };
    }
    if (job.diagram && !looksLikeDiagram(text)) {
      return { status: "failed", error: "The AI did not answer with a diagram. Try again." };
    }
    return { status: "ready", result: text };
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
      const req = await request(job);
      if (find(job.id)?.status !== "running") return;
      const taskId = await api.aiInline(req, (e) => {
        if (find(job.id)?.status !== "running") return;
        if (e.type === "textDelta") {
          raw += e.text;
        } else if (e.type === "error") {
          finish(job.id, { status: "failed", error: e.error.message });
        } else if (e.type === "done") {
          finish(job.id, outcome(job, raw));
        }
      });
      if (find(job.id)?.status === "running") taskIds.set(job.id, taskId);
      else void api.aiCancel(taskId).catch(() => undefined);
    } catch (e) {
      finish(job.id, { status: "failed", error: toApiError(e).message });
    }
  };

  /** Puts a job in the queue and shows the queue, so it is seen without looking for it. */
  const enqueue = (job: AiJob): string => {
    set((s) => ({ jobs: [...s.jobs, job] }));
    get().showTasks();
    pump();
    return job.id;
  };
  const base = (): JobBase => ({
    id: `job${String(counter++)}`,
    status: "queued",
    error: null,
    createdAt: Date.now(),
  });

  return {
    jobs: [],
    tab: "chat",
    setTab: (tab) => {
      set({ tab });
    },
    add: (spec) => enqueue({ ...base(), ...spec, kind: "edit", result: "" }),
    addPick: (spec) =>
      enqueue({
        ...base(),
        kind: "pick",
        label: spec.label,
        spec,
        instruction: spec.instruction,
        picks: null,
      }),
    again: (id, instruction) => {
      const job = find(id);
      if (job?.kind !== "pick" || job.status === "running" || job.status === "queued") return;
      patch(id, {
        status: "queued",
        error: null,
        picks: null,
        instruction: instruction ?? job.instruction,
      });
      pump();
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
    goTo: (id) => {
      const job = find(id);
      if (!job) return;
      if (job.kind === "pick") {
        job.spec.goTo?.();
        return;
      }
      void useVaultStore.getState().openNote(job.notePath);
    },
    acceptPicks: async (id, chosen) => {
      const job = find(id);
      if (job?.kind !== "pick" || job.status !== "ready") return;
      try {
        const picks = job.picks;
        if (chosen.length > 0 && picks !== null) {
          await betweenVersions(`${job.spec.label} in ${job.spec.notePath}`, () =>
            job.spec.add(chosen, picks),
          );
        }
        get().remove(id);
      } catch (e) {
        reportError(e);
      }
    },
    accept: async (id) => {
      const job = find(id);
      if (job?.kind !== "edit" || job.status !== "ready") return;
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
        const typed = await writeAccepted(path, note.content, spot, replacement, next);
        await api.commitNow({ kind: "ai", detail: `${job.label} in ${path}` }, [path]);
        get().remove(id);
        const vault = useVaultStore.getState();
        if (vault.activePath === path) {
          // A reload would empty the editor's undo history, so only when the editor is behind.
          if (!typed) useVaultStore.setState((s) => ({ reloadNonce: s.reloadNonce + 1 }));
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
