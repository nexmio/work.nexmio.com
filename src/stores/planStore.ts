import { create } from "zustand";
import { api, toApiError } from "@/lib/api";
import { flushPendingWrites } from "@/lib/flush";
import {
  frontTags,
  parsePlan,
  planTitle,
  serializePlan,
  duplicateCount,
  type NodePath,
  type PlanNode,
} from "@/lib/planTree";
import { basename, dirname } from "@/lib/utils";
import { fileNameFrom } from "@/lib/noteTitle";
import { projectTag, tagFor } from "@/lib/noteTags";
import { usePlanIndex } from "./planIndexStore";
import { reportError, useUiStore } from "./uiStore";
import { projectForPath, useVaultStore } from "./vaultStore";

/** The tag that makes a note a plan, and the one that says it is finished. */
export const PLAN_TAG = "plan";
export const FINISHED_TAG = "plan-finished";
/** The folder new plans are made in. */
export const PLANS_FOLDER = "Plans";

/** The folders inside a project where its epics and its notes are kept. */
export const EPICS_SUBFOLDER = "Epics";
export const NOTES_SUBFOLDER = "Notes";

/** Where a new plan is kept: in `Plans/`, in a project made for it, or in a folder that is there. */
export type PlanPlace = "plans" | "project" | { folder: string };

/**
 * Where what is made from a plan is kept. A plan in a project keeps its epics in the project's
 * `Epics` folder and its notes in `Notes`; any other plan keeps epics in `Tasks/` and notes next
 * to itself.
 */
export function planHome(planPath: string): { epics: string | undefined; notes: string } {
  const project = projectForPath(useVaultStore.getState().projects, planPath);
  if (project) {
    return {
      epics: `${project.folder}/${EPICS_SUBFOLDER}`,
      notes: `${project.folder}/${NOTES_SUBFOLDER}`,
    };
  }
  return { epics: undefined, notes: dirname(planPath) };
}

/**
 * The tag of a plan: the tag of its project (made from the project's name when the project was
 * made), or one made from the plan's own name when it is in no project. Everything the plan makes
 * (its page, its epic, tasks and pages) gets it.
 */
export function planTag(planPath: string, title?: string): string {
  const project = projectForPath(useVaultStore.getState().projects, planPath);
  if (project) return projectTag(project);
  return tagFor(title ?? basename(planPath).replace(/\.md$/i, ""));
}

export type PlanView = "overview" | "map" | "outline";

/** The window that is open over a plan, and for which idea (the top level for `[]`). */
export type PlanDialog =
  | { kind: "link"; path: NodePath }
  | { kind: "linktask"; path: NodePath }
  | { kind: "repeat"; path: NodePath }
  | { kind: "add"; path: NodePath }
  /** The short note of a part. */
  | { kind: "note"; path: NodePath }
  /** Make a plan of a project that is there (`folder`, or the one to choose when `null`). */
  | { kind: "import"; folder: string | null }
  | { kind: "finish" }
  /** Delete an archived plan (and, if ticked, what was made from it). */
  | { kind: "delete" };

export interface PlanSummary {
  path: string;
  title: string;
  finished: boolean;
  ideas: number;
}

const VIEW_KEY = "nexmio.planView";

function readView(): PlanView {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "outline" || v === "overview" ? v : "map";
  } catch {
    return "map";
  }
}

function countIdeas(nodes: readonly PlanNode[]): number {
  return nodes.reduce((n, x) => n + 1 + countIdeas(x.children), 0);
}

/** What changing the ideas gives: the new list and, if it knows, where the chosen idea is now. */
export type Change = PlanNode[] | { nodes: PlanNode[]; path: NodePath | null };

interface PlanState {
  plans: PlanSummary[];
  loaded: boolean;
  /** The note of the plan that is open, and what is read from it. */
  path: string | null;
  title: string;
  finished: boolean;
  nodes: PlanNode[];
  view: PlanView;
  selected: NodePath | null;
  /** The window that makes a new plan step by step is open. */
  guidedOpen: boolean;
  setGuidedOpen: (open: boolean) => void;
  dialog: PlanDialog | null;
  setDialog: (d: PlanDialog | null) => void;
  /** The idea under which a new idea is being written (the top level for `[]`), if any. */
  adding: NodePath | null;
  setAdding: (p: NodePath | null) => void;
  setView: (v: PlanView) => void;
  select: (p: NodePath | null) => void;
  /** The part whose note is being written in the right panel (asked for from the map's menu). */
  noteAt: NodePath | null;
  setNoteAt: (p: NodePath | null) => void;
  /** Reads the list of plans. */
  load: () => Promise<void>;
  /** Opens a plan in the middle. */
  open: (path: string) => Promise<void>;
  /**
   * Changes the ideas of the open plan: the note is read again, `fn` changes its list, and the
   * note is written. Everything around the list in the note stays as it was.
   */
  edit: (fn: (nodes: PlanNode[]) => Change) => Promise<boolean>;
  /** Makes a plan (a note with the tag `plan` in Plans) and opens it (unless `open` is false). */
  create: (
    title: string,
    nodes?: PlanNode[],
    open?: boolean,
    place?: PlanPlace,
  ) => Promise<string | null>;
  /** Marks the open plan finished, or open again. */
  setFinished: (finished: boolean) => Promise<void>;
  /**
   * Deletes the open plan's page and the files in `also` (its epic, pages made from it). Each is
   * saved in History first, so it can be brought back with "Recover deleted".
   */
  remove: (also: readonly string[]) => Promise<boolean>;
}

export const usePlanStore = create<PlanState>((set, get) => {
  const bumpEditor = (path: string): void => {
    if (useVaultStore.getState().activePath === path) {
      useVaultStore.setState((s) => ({ reloadNonce: s.reloadNonce + 1 }));
    }
  };
  const fail = (e: unknown): false => {
    const err = toApiError(e);
    if (err.code === "Conflict") useUiStore.getState().toast(err.message, "error");
    else reportError(e);
    return false;
  };
  return {
    plans: [],
    loaded: false,
    path: null,
    title: "",
    finished: false,
    nodes: [],
    view: readView(),
    selected: null,
    guidedOpen: false,
    setGuidedOpen: (guidedOpen) => {
      set({ guidedOpen });
    },
    dialog: null,
    setDialog: (dialog) => {
      set({ dialog });
    },
    adding: null,
    setAdding: (adding) => {
      set({ adding });
    },
    setView: (view) => {
      try {
        localStorage.setItem(VIEW_KEY, view);
      } catch {
        /* the choice just is not remembered */
      }
      set({ view });
    },
    select: (selected) => {
      set({ selected });
    },
    noteAt: null,
    setNoteAt: (noteAt) => {
      set({ noteAt });
    },
    load: async () => {
      try {
        await flushPendingWrites();
        const notes = await api.taggedNotes(PLAN_TAG);
        const plans = notes
          .map((n) => ({
            path: n.path,
            title: planTitle(n.content, basename(n.path).replace(/\.md$/i, "")),
            finished: frontTags(n.content).includes(FINISHED_TAG),
            ideas: countIdeas(parsePlan(n.content).nodes),
          }))
          .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
        set({ plans, loaded: true });
        usePlanIndex.getState().setPaths(plans.map((p) => p.path));
      } catch (e) {
        reportError(e);
      }
    },
    open: async (path) => {
      try {
        await flushPendingWrites();
        const note = await api.readNote(path);
        set({
          path,
          title: planTitle(note.content, basename(path).replace(/\.md$/i, "")),
          finished: frontTags(note.content).includes(FINISHED_TAG),
          nodes: parsePlan(note.content).nodes,
          selected: null,
        });
        useUiStore.getState().openArea("plans");
      } catch (e) {
        reportError(e);
      }
    },
    edit: async (fn) => {
      const path = get().path;
      if (path === null) return false;
      try {
        await flushPendingWrites();
        const note = await api.readNote(path);
        const parsed = parsePlan(note.content);
        const changed = fn(parsed.nodes);
        const nodes = Array.isArray(changed) ? changed : changed.nodes;
        // Two parts of the same part may not have the same words: the map would take them for one.
        if (duplicateCount(nodes) > duplicateCount(parsed.nodes)) {
          useUiStore
            .getState()
            .toast("There is already a part with that name under the same part.", "error");
          return false;
        }
        const text = serializePlan({ ...parsed, nodes });
        if (text !== note.content) {
          await api.writeNote(path, text);
          bumpEditor(path);
        }
        set((s) => ({
          nodes,
          finished: frontTags(text).includes(FINISHED_TAG),
          selected: Array.isArray(changed) ? s.selected : changed.path,
        }));
        void get().load();
        return true;
      } catch (e) {
        return fail(e);
      }
    },
    create: async (title, nodes = [], open = true, place = "plans") => {
      const name = fileNameFrom(title);
      try {
        let folder = PLANS_FOLDER;
        if (place === "project") {
          // A project of its own: a folder with the name of the plan, and the AI rules of a project.
          const made = await api.createProject(title.trim(), "", null);
          await useVaultStore.getState().refreshProjects();
          folder = made.folder;
        } else if (typeof place === "object") folder = place.folder;
        const taken = new Set(useVaultStore.getState().files);
        let path = `${folder}/${name}.md`;
        for (let i = 2; taken.has(path); i++) path = `${folder}/${name} ${String(i)}.md`;
        const tag = planTag(path, title.trim());
        const tags = tag === PLAN_TAG ? PLAN_TAG : `${PLAN_TAG}, ${tag}`;
        const head = [`---`, `tags: [${tags}]`, `---`, `# ${title.trim()}`, ``, ``];
        await api.writeNote(path, serializePlan({ head, nodes, tail: [""] }));
        await useVaultStore.getState().refreshTree();
        await get().load();
        if (open) await get().open(path);
        return path;
      } catch (e) {
        fail(e);
        return null;
      }
    },
    setFinished: async (finished) => {
      const path = get().path;
      if (path === null) return;
      try {
        await flushPendingWrites();
        await api.noteSetTag(path, FINISHED_TAG, finished);
        bumpEditor(path);
        set({ finished });
        await get().load();
      } catch (e) {
        fail(e);
      }
    },
    remove: async (also) => {
      const path = get().path;
      if (path === null) return false;
      const vault = useVaultStore.getState();
      for (const p of [path, ...also]) {
        if (!(await vault.deletePath(p))) return false;
      }
      set({ path: null, title: "", nodes: [], selected: null, finished: false, dialog: null });
      await get().load();
      return true;
    },
  };
});
