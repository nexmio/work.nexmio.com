import { create } from "zustand";
import type { MetaPatch } from "@/bindings/MetaPatch";
import type { Epic } from "@/bindings/Epic";
import type { Task } from "@/bindings/Task";
import type { TaskLog } from "@/bindings/TaskLog";
import type { TaskStep } from "@/bindings/TaskStep";
import { api, toApiError } from "@/lib/api";
import { flushPendingWrites } from "@/lib/flush";
import { taskRef, taskText, todayIso, ALL_AREA } from "@/lib/taskLogic";
import { useTagStore } from "./tagStore";
import { reportError, useUiStore } from "./uiStore";
import { useVaultStore } from "./vaultStore";

/** Which task the task page shows. The title helps to find it again if its line moved. */
export interface TaskRef {
  path: string;
  line: number;
  title: string;
}

/** The epic that quick tasks go into when no epic is chosen. */
export const INBOX_PATH = "Tasks/Inbox.md";

interface TaskState {
  tasks: Task[];
  loaded: boolean;
  loading: boolean;
  selected: TaskRef | null;
  /** The epic notes (the notes in `Tasks/`). Notes with tasks elsewhere are epics too. */
  epics: Epic[];
  /** The epic that is open on its page. */
  epicPath: string | null;
  /**
   * The area the task list shows: an epic's note path, `LOOSE_AREA`, or `ALL_AREA` (every epic in
   * rows), which is where Tasks opens.
   */
  chosenArea: string | null;
  /** Chooses the area the task list shows. */
  chooseArea: (path: string | null) => void;
  /** The vault that `chosenArea` belongs to; another vault opens on every epic again. */
  areaVault: string | undefined;
  /** Goes back to every epic when another vault is open than the one the area was chosen in. */
  restoreArea: () => void;
  /** The task shown in the quick look over the list, if it is open. */
  looking: TaskRef | null;
  /** Opens the quick look on a task, or closes it with null. */
  look: (ref: TaskRef | null) => void;
  /** Tasks whose steps are shown in the list (`path:line`), for this session only. */
  openTasks: Record<string, boolean>;
  toggleTaskOpen: (id: string) => void;
  /** Reads every task from every note, and the epics. */
  load: () => Promise<void>;
  /** The epics in the order the user chose (note paths), from the vault. */
  epicOrder: string[];
  /** Moves an epic one place up or down among `shown` (the epics in the order on screen). */
  moveEpic: (path: string, up: boolean, shown: readonly string[]) => Promise<void>;
  /** Moves a task (with its steps) or a step one place up or down in its note. */
  move: (path: string, line: number, key: string, up: boolean) => Promise<void>;
  /** The tag the task list is narrowed to (a tag of an epic or a task), or null for all. */
  tagFilter: string | null;
  setTagFilter: (tag: string | null) => void;
  /** Puts a tag on a task (written as `#tag` in its line) or takes it off. */
  setTaskTag: (t: Task, tag: string, on: boolean) => Promise<void>;
  /** Puts a tag on an epic (in its page's properties) or takes it off. */
  setEpicTag: (path: string, tag: string, on: boolean) => Promise<void>;
  /** Changes the title of an epic (its heading; the note keeps its name). */
  renameEpic: (path: string, title: string) => Promise<void>;
  /** Makes a note that has tasks an epic (it gets the tag `epic`). */
  adoptEpic: (path: string) => Promise<void>;
  /** Makes several notes epics at once. TEMPORARY: remove in the release after 0.18.0. */
  /** Points a task at a note (a link target), or takes the link off with `null`. */
  setLink: (t: Task, link: string | null) => Promise<void>;
  /**
   * Makes a note for a task, links the task to it and writes a line in the note that points back.
   * Resolves to the new note's path, or null when it could not be made.
   */
  makeNote: (
    t: Task,
    opts: { name: string; folder: string; template: string | null },
  ) => Promise<string | null>;
  /** Deletes a step. The note is committed first, and a toast can bring the step back. */
  removeStep: (t: Task, step: TaskStep) => Promise<void>;
  /** Opens an epic on its page. */
  openEpic: (path: string) => void;
  /** Makes a new epic (a note in `Tasks/`) and opens it, unless `open` is false. Resolves to its note. */
  createEpic: (title: string, open?: boolean, folder?: string) => Promise<string | null>;
  /** The epic note for a note: itself when it is in `Tasks/`, else the one made for it. */
  epicFor: (note: string, folder?: string) => Promise<string | null>;
  /** Moves a task, with its steps and log, into an epic. The task page follows it. */
  moveToEpic: (t: Task, epicPath: string) => Promise<void>;
  select: (ref: TaskRef | null) => void;
  /** Opens a task on the task page. */
  open: (t: Task) => void;
  /**
   * Adds a task to an epic: the one at `path`, or the Inbox when none is given. What was typed is
   * the title; Nexmio Work adds the day it was made.
   */
  add: (text: string, note?: string, steps?: string[], path?: string) => Promise<void>;
  /** Changes the title of a task or one of its steps. */
  rename: (path: string, line: number, key: string, title: string) => Promise<void>;
  setDone: (path: string, line: number, key: string, done: boolean) => Promise<void>;
  setMeta: (t: Task, patch: MetaPatch) => Promise<void>;
  /** Writes a line in the task's history (what Nexmio Work did: a status, what it waits for). */
  addHistory: (t: Task, text: string) => Promise<void>;
  /** Pins a task to the start page, or takes it off. */
  setPinned: (t: Task, on: boolean) => Promise<void>;
  /** Changes the status and writes it in the task's history. */
  setStatus: (t: Task, status: string | null) => Promise<void>;
  /** Writes who or what a waiting task waits for (`null` removes it) and notes it in the log. */
  setWaitingFor: (t: Task, text: string | null) => Promise<void>;
  /**
   * Makes `t` wait for another task (`null` takes the link off). A task that waits for a task has
   * the status Waiting, and the choice is written in the log.
   */
  setAfter: (t: Task, other: Task | null) => Promise<void>;
  addStep: (t: Task, text: string) => Promise<void>;
  addLog: (t: Task, text: string) => Promise<void>;
  /** Changes the date and text of one line of the log. */
  editLog: (t: Task, l: TaskLog, date: string, text: string) => Promise<void>;
  /** Deletes one line of the log. The note is committed first, so History has it. */
  deleteLog: (t: Task, l: TaskLog) => Promise<void>;
  /** Sets the note of a task (empty text removes it). */
  setNote: (t: Task, text: string) => Promise<void>;
  /** Sets the description of an epic (the text under its heading). */
  setDescription: (epicPath: string, text: string) => Promise<void>;
  /** Adds tasks to a note (for example the ones the AI found in it). */
  addToNote: (path: string, texts: string[]) => Promise<void>;
  /** Drops a task: it is kept in the note but no longer shown as open. */
  drop: (t: Task) => Promise<void>;
  /** Deletes a task with its steps and log. The note is committed first, so History has it. */
  remove: (t: Task) => Promise<void>;
}

/** Replaces the tasks of one note in the list. */
function replaceNote(all: Task[], path: string, fresh: Task[]): Task[] {
  return [...all.filter((t) => t.path !== path), ...fresh];
}

/** Finds the task a reference points at. */
export function findTask(tasks: readonly Task[], ref: TaskRef | null): Task | null {
  if (ref === null) return null;
  const here = tasks.filter((t) => t.path === ref.path);
  return (
    here.find((t) => t.line === ref.line && t.title === ref.title) ??
    here.find((t) => t.title === ref.title) ??
    null
  );
}

/** The read of the task list that is running now, and the one that follows it, if any. */
let running: Promise<void> | null = null;
let next: Promise<void> | null = null;

export const useTaskStore = create<TaskState>((set, get) => {
  /** Runs one change of a note: saves the editor first, updates the list, reloads an open note. */
  const mutate = async (path: string, call: () => Promise<Task[]>): Promise<Task[] | null> => {
    try {
      await flushPendingWrites();
      const fresh = await call();
      set((s) => ({ tasks: replaceNote(s.tasks, path, fresh) }));
      if (useVaultStore.getState().activePath === path) {
        useVaultStore.setState((s) => ({ reloadNonce: s.reloadNonce + 1 }));
      }
      return fresh;
    } catch (e) {
      const err = toApiError(e);
      if (err.code === "Conflict") {
        useUiStore.getState().toast(err.message, "error");
        void get().load();
      } else {
        reportError(e);
      }
      return null;
    }
  };

  return {
    tasks: [],
    loaded: false,
    loading: false,
    selected: null,
    epics: [],
    epicPath: null,
    chosenArea: ALL_AREA,
    chooseArea: (path) => {
      set({ chosenArea: path, looking: null });
    },
    areaVault: undefined,
    restoreArea: () => {
      const vault = useVaultStore.getState().vault?.path ?? "";
      if (get().areaVault === vault) return;
      set({ chosenArea: ALL_AREA, looking: null, areaVault: vault });
    },
    looking: null,
    look: (ref) => {
      set(ref === null ? { looking: null } : { looking: ref, selected: ref });
    },
    openTasks: {},
    toggleTaskOpen: (id) => {
      set((s) => ({ openTasks: { ...s.openTasks, [id]: !s.openTasks[id] } }));
    },
    openEpic: (path) => {
      set({ epicPath: path });
      useUiStore.getState().setCenterView("epic");
    },
    tagFilter: null,
    setTagFilter: (tagFilter) => {
      set({ tagFilter });
    },
    setTaskTag: async (t, tag, on) => {
      await mutate(t.path, () => api.taskSetTag(t.path, t.line, t.key, tag, on));
      void useTagStore.getState().load();
    },
    setEpicTag: async (path, tag, on) => {
      try {
        await flushPendingWrites();
        // The page's own tags come back; the epic's tags are those without `epic` itself.
        const tags = (await api.noteSetTag(path, tag, on)).filter((t) => t !== "epic");
        set((s) => ({ epics: s.epics.map((e) => (e.path === path ? { ...e, tags } : e)) }));
        if (useVaultStore.getState().activePath === path) {
          useVaultStore.setState((s) => ({ reloadNonce: s.reloadNonce + 1 }));
        }
        void useTagStore.getState().load();
      } catch (e) {
        reportError(e);
      }
    },
    renameEpic: async (path, title) => {
      try {
        await flushPendingWrites();
        const e = await api.epicSetTitle(path, title);
        set((s) => ({ epics: s.epics.map((x) => (x.path === e.path ? e : x)) }));
        if (useVaultStore.getState().activePath === path) {
          useVaultStore.setState((s) => ({ reloadNonce: s.reloadNonce + 1 }));
        }
      } catch (e) {
        reportError(e);
      }
    },
    setLink: async (t, link) => {
      await mutate(t.path, () => api.taskSetLink(t.path, t.line, t.key, link));
    },
    makeNote: async (t, opts) => {
      try {
        await flushPendingWrites();
        const path = await api.createNoteFromTemplate(opts.folder, opts.name, opts.template);
        const note = await api.readNote(path);
        const vault = useVaultStore.getState();
        const back = vault.resolver.shortestForm(t.path);
        await api.writeNote(path, `${note.content.trimEnd()}\n\nTask in [[${back}]]\n`);
        await vault.refreshTree();
        const resolver = useVaultStore.getState().resolver;
        const stem = path.replace(/\.md$/i, "");
        const name = stem.split("/").pop() ?? stem;
        await get().setLink(t, resolver.resolve(name) === path ? name : stem);
        return path;
      } catch (e) {
        reportError(e);
        return null;
      }
    },
    adoptEpic: async (path) => {
      try {
        await flushPendingWrites();
        const e = await api.epicAdopt(path);
        set((s) => ({ epics: [...s.epics.filter((x) => x.path !== e.path), e] }));
        if (useVaultStore.getState().activePath === path) {
          useVaultStore.setState((s) => ({ reloadNonce: s.reloadNonce + 1 }));
        }
      } catch (e) {
        reportError(e);
      }
    },
    removeStep: async (t, step) => {
      const fresh = await mutate(t.path, () => api.taskDelete(t.path, step.line, step.key));
      if (fresh === null) return;
      useUiStore.getState().toast("Deleted the step.", "success", {
        label: "Undo",
        run: () => {
          const owner = get().tasks.find((x) => x.path === t.path && x.line === t.line) ?? t;
          void get().addStep(owner, step.text);
        },
      });
    },
    createEpic: async (title, open = true, folder) => {
      try {
        await flushPendingWrites();
        const e =
          folder === undefined ? await api.epicCreate(title) : await api.epicCreate(title, folder);
        set((s) => ({ epics: [...s.epics.filter((x) => x.path !== e.path), e] }));
        await useVaultStore.getState().refreshTree();
        if (open) get().openEpic(e.path);
        return e.path;
      } catch (e) {
        reportError(e);
        return null;
      }
    },
    epicFor: async (note, folder) => {
      try {
        await flushPendingWrites();
        const e =
          folder === undefined ? await api.epicForNote(note) : await api.epicForNote(note, folder);
        set((s) => ({ epics: [...s.epics.filter((x) => x.path !== e.path), e] }));
        await useVaultStore.getState().refreshTree();
        return e.path;
      } catch (e) {
        reportError(e);
        return null;
      }
    },
    load: () => {
      // The list is asked for from many places at once. While one read runs, every other ask shares
      // one more read that starts when it is done, so nobody gets a list older than the ask.
      const read = async (): Promise<void> => {
        set({ loading: true });
        try {
          await flushPendingWrites();
          const [tasks, epics, epicOrder] = await Promise.all([
            api.listTasks(),
            api.listEpics(),
            api.getEpicOrder().catch(() => [] as string[]),
          ]);
          set({ tasks, epics, epicOrder, loaded: true });
        } catch (e) {
          reportError(e);
        } finally {
          set({ loading: false });
        }
      };
      const start = (): Promise<void> => {
        running = read().finally(() => {
          running = null;
        });
        return running;
      };
      if (running === null) return start();
      next ??= running.then(() => {
        next = null;
        return start();
      });
      return next;
    },
    epicOrder: [],
    moveEpic: async (path, up, shown) => {
      const list = shown.filter((p) => p !== INBOX_PATH);
      const i = list.indexOf(path);
      const j = up ? i - 1 : i + 1;
      if (i === -1 || j < 0 || j >= list.length) return;
      const swapped = [...list];
      [swapped[i], swapped[j]] = [swapped[j] ?? path, swapped[i] ?? path];
      // Epics not shown (the done ones) keep their place after the shown ones.
      const next = [...swapped, ...get().epicOrder.filter((p) => !swapped.includes(p))];
      set({ epicOrder: next });
      try {
        await api.setEpicOrder(next);
      } catch (e) {
        reportError(e);
      }
    },
    move: async (path, line, key, up) => {
      await mutate(path, () => api.taskMove(path, line, key, up));
    },
    moveToEpic: async (t, epicPath) => {
      const fresh = await mutate(t.path, () => api.taskMoveTo(t.path, t.line, t.key, epicPath));
      if (fresh === null) return;
      await get().load();
      const now = get().tasks.find((x) => x.path === epicPath && x.title === t.title);
      const sel = get().selected;
      if (now !== undefined && sel !== null && sel.path === t.path && sel.title === t.title) {
        set({ selected: { path: now.path, line: now.line, title: now.title } });
      }
      useUiStore.getState().toast(`Moved “${t.title}” into the epic.`);
    },
    select: (selected) => {
      set({ selected });
    },
    open: (t) => {
      set({ selected: { path: t.path, line: t.line, title: t.title } });
      useUiStore.getState().setCenterView("task");
    },
    add: async (text, note, steps, path) => {
      const line = taskText(text);
      if (line === "") return;
      const extra = note?.trim() ?? "";
      const list = (steps ?? []).filter((s) => s.trim() !== "");
      const target = path ?? INBOX_PATH;
      const fresh = await mutate(target, () =>
        extra === "" && list.length === 0 && path === undefined
          ? api.taskAdd(line)
          : api.taskAdd(line, extra === "" ? undefined : extra, list, target),
      );
      // A first task makes its note, so the epic list may have a new entry.
      if (fresh !== null && !get().epics.some((e) => e.path === target)) {
        await get().load();
        await useVaultStore.getState().refreshTree();
      }
    },
    rename: async (path, line, key, title) => {
      // What is kept about the task, and the tasks that wait for it, follow the new title (Rust).
      const fresh = await mutate(path, () => api.taskSetTitle(path, line, key, title));
      if (fresh !== null && get().tasks.some((t) => t.after !== null)) void get().load();
      const sel = get().selected;
      if (fresh !== null && sel !== null && sel.path === path && sel.line === line) {
        const now = fresh.find((t) => t.line === line);
        if (now) set({ selected: { ...sel, title: now.title } });
      }
    },
    setDone: async (path, line, key, done) => {
      await mutate(path, () => api.taskSetDone(path, line, key, done));
    },
    setMeta: async (t, patch) => {
      await mutate(t.path, () => api.taskSetMeta(t.path, t.line, t.key, patch));
    },
    setStatus: async (t, status) => {
      const fresh = await mutate(t.path, () =>
        api.taskSetMeta(t.path, t.line, t.key, {
          status: status === "" ? null : status,
          // What a task waits for only means something while it waits.
          ...(status === "waiting" ? {} : { waitingFor: null, after: null }),
        }),
      );
      if (fresh !== null && status !== null && status !== "") {
        await get().addHistory(t, `Status: ${status}`);
      }
    },
    setWaitingFor: async (t, text) => {
      const fresh = await mutate(t.path, () =>
        api.taskSetMeta(t.path, t.line, t.key, { waitingFor: text }),
      );
      if (fresh !== null && text !== null) await get().addHistory(t, `Waiting for: ${text}`);
    },
    setAfter: async (t, other) => {
      const fresh = await mutate(t.path, () =>
        api.taskSetMeta(t.path, t.line, t.key, {
          after: other === null ? null : taskRef(other),
          ...(other !== null && t.status !== "waiting" ? { status: "waiting" } : {}),
        }),
      );
      if (fresh !== null && other !== null) {
        await get().addHistory(t, `Waiting for the task: ${other.title}`);
      }
    },
    addStep: async (t, text) => {
      await mutate(t.path, () => api.taskAddStep(t.path, t.line, t.key, text));
    },
    setPinned: async (t, on) => {
      await mutate(t.path, () => api.taskSetPinned(t.path, t.title, on));
    },
    addHistory: async (t, text) => {
      await mutate(t.path, () => api.taskHistoryAdd(t.path, t.title, todayIso(), text));
    },
    addLog: async (t, text) => {
      await mutate(t.path, () => api.taskAddLog(t.path, t.line, t.key, todayIso(), text));
    },
    editLog: async (t, l, date, text) => {
      await mutate(t.path, () => api.taskEditLog(t.path, l.line, l.key, date, text));
    },
    deleteLog: async (t, l) => {
      await mutate(t.path, () => api.taskDeleteLog(t.path, l.line, l.key));
    },
    setNote: async (t, text) => {
      await mutate(t.path, () => api.taskSetNote(t.path, t.line, t.key, text));
    },
    setDescription: async (epicPath, text) => {
      try {
        await flushPendingWrites();
        const e = await api.epicSetDescription(epicPath, text);
        set((s) => ({ epics: s.epics.map((x) => (x.path === e.path ? e : x)) }));
        if (useVaultStore.getState().activePath === epicPath) {
          useVaultStore.setState((s) => ({ reloadNonce: s.reloadNonce + 1 }));
        }
      } catch (e) {
        reportError(e);
      }
    },
    addToNote: async (path, texts) => {
      await mutate(path, () => api.taskAddToNote(path, texts));
    },
    drop: async (t) => {
      await get().setMeta(t, { status: "dropped" });
    },
    remove: async (t) => {
      const fresh = await mutate(t.path, () => api.taskDelete(t.path, t.line, t.key));
      if (fresh === null) return;
      if (get().selected?.title === t.title && get().selected?.path === t.path) {
        set({ selected: null });
        if (useUiStore.getState().centerView === "task")
          useUiStore.getState().setCenterView("tasks");
      }
      useUiStore
        .getState()
        .toast("Deleted the task. It can be brought back from the page's History.", "success");
    },
  };
});
