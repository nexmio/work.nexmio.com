import type { Project } from "@/bindings/Project";
import type { RenamePreview } from "@/bindings/RenamePreview";

export type LeftTab = "files" | "search" | "tasks" | "ideas" | "meetings" | "plans";
/** What fills the middle of the window. */
export type CenterView =
  | "notes"
  | "tasks"
  | "epic"
  | "task"
  | "time"
  | "lookback"
  | "ideas"
  | "meetings"
  | "plans"
  | "start";

/** The area (the left panel) a middle page belongs to, or null for the pages and the start page. */
export function areaOf(v: CenterView): LeftTab | null {
  switch (v) {
    case "tasks":
    case "epic":
    case "task":
    case "time":
    case "lookback":
      return "tasks";
    case "ideas":
    case "meetings":
    case "plans":
      return v;
    default:
      return null;
  }
}

/** The task list, an epic or a task: all of them are the Tasks area. */
export function isTasksView(v: CenterView): boolean {
  return v === "tasks" || v === "epic" || v === "task" || v === "time" || v === "lookback";
}
/** The tabs of the right panel. `task` and `part` belong to the Tasks and Plans areas. */
export type RightTab = "outline" | "links" | "history" | "images" | "timer" | "task" | "part";
/** The tabs about the page in the middle; they are only there while a page is shown. */
export const PAGE_TABS: readonly RightTab[] = ["outline", "links", "history", "images"];

export type LinkUpdateChoice = "update" | "skip" | "cancel";

export interface Toast {
  id: number;
  kind: "info" | "error" | "success";
  message: string;
  /** A button in the toast, for example Undo. */
  action?: { label: string; run: () => void };
}

/** A message that must not be overlooked: shown in a dialog until the user closes it. */
export interface Notice {
  title: string;
  /** What went wrong, one line each (several when more than one item failed). */
  details: string[];
  /** What the user can do about it. */
  hint: string;
}

export interface ProjectDialogState {
  folder: string;
  project: Project | null;
}

export interface LinkUpdatePrompt {
  preview: RenamePreview;
  resolve: (choice: LinkUpdateChoice) => void;
}

/** A picture shown large. `path` is its vault path when known (it can then be opened elsewhere). */
export interface ImagePreview {
  src: string;
  name: string;
  path: string | null;
}

/** The middle view after a side panel is asked for: the notes instead of the start page. */
export function leavingStart(v: CenterView): CenterView {
  return v === "start" ? "notes" : v;
}
