import type { StateCreator } from "zustand";
import {
  areaOf,
  leavingStart,
  PAGE_TABS,
  type CenterView,
  type LeftTab,
  type RightTab,
} from "./types";
import type { UiState } from "./state";

/** What fills the middle and the side panels, and the requests that move between areas. */
export interface PanelsSlice {
  leftTab: LeftTab;
  rightTab: RightTab;
  /** The AI box (chat and queue) is open over the right side, whatever is shown under it. */
  askOpen: boolean;
  setAskOpen: (open: boolean) => void;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  /** Raised when "New plan" is pressed outside the Plans area; the Plans panel listens. */
  newPlanNonce: number;
  requestNewPlan: () => void;
  /** What fills the middle of the window: the notes, the task list or one task. */
  centerView: CenterView;
  setCenterView: (v: CenterView) => void;
  /** Where the task page was opened from, so Back goes there (null when it is not open). */
  taskFrom: CenterView | null;
  /** The right panel was closed and opened by a task: opening that task as a full page closes it again. */
  rightOpenedForTask: boolean;
  /** Where "open the note" came from, so the note can offer a way back to the task or epic. */
  /** Shows the tasks or the ideas: their own panel on the left and their page in the middle. */
  openArea: (area: "tasks" | "ideas" | "meetings" | "plans") => void;
  /** Shows the start page in the middle (the left panel stays as it is). */
  openStart: () => void;
  focusChatNonce: number;
  focusSearchNonce: number;
  /** Search text pushed from elsewhere (e.g. a tag click). */
  searchSeed: string;

  setLeftTab: (t: LeftTab) => void;
  setRightTab: (t: RightTab) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  /** A project (its folder) that should be made a plan; Plans picks this up when it opens. */
  /** A plan that something outside the Plans area asked to open (it is opened there). */
  planToOpen: string | null;
  openPlan: (path: string) => void;
  clearPlanToOpen: () => void;
  planFromProjectFolder: string | null;
  /** Opens Plans with the window that makes a plan of the project in `folder`. */
  planFromProject: (folder: string) => void;
  clearPlanFromProject: () => void;
  focusChat: () => void;
  focusSearch: (seed?: string) => void;
}

export const panelsSlice: StateCreator<UiState, [], [], PanelsSlice> = (set, get) => ({
  leftTab: "files",
  rightTab: "outline",
  askOpen: false,
  // The AI box lies over the right side: opening it changes nothing under it (the start page
  // stays, the right panel keeps its tab).
  setAskOpen: (askOpen) => {
    set({ askOpen });
  },
  newPlanNonce: 0,
  requestNewPlan: () => {
    set((s) => ({ newPlanNonce: s.newPlanNonce + 1 }));
    get().openArea("plans");
  },
  leftCollapsed: false,
  // The right panel opens only when asked for: the note gets the width.
  rightCollapsed: true,
  centerView: "notes",
  taskFrom: null,
  rightOpenedForTask: false,
  setCenterView: (centerView) => {
    // The left panel follows the middle: a task, an epic, a meeting, an idea or a plan opened from
    // anywhere (a plan, the start page, a search, a page) brings its own list to the left. Back to
    // the pages: the left panel shows the files again, not the Tasks or Ideas list.
    set((s) => {
      // Opening a task as a full page remembers where it came from; Back goes there.
      const from: Pick<UiState, "taskFrom"> =
        centerView === "task" && s.centerView !== "task"
          ? { taskFrom: s.centerView }
          : { taskFrom: s.taskFrom };
      // A panel that was shut and opened only to show the task goes shut again on the full page.
      const closeAgain = centerView === "task" && s.rightOpenedForTask && s.centerView !== "task";
      const panel: Pick<UiState, "rightOpenedForTask"> & { rightCollapsed?: boolean } = closeAgain
        ? { rightOpenedForTask: false, rightCollapsed: true }
        : {
            rightOpenedForTask:
              centerView === "tasks" || centerView === "epic" ? s.rightOpenedForTask : false,
          };
      const area = areaOf(centerView);
      if (area !== null) {
        if (s.leftTab === area) return { centerView, ...from, ...panel };
        // The ideas are cards in the middle: the list at the left would show the same thing twice.
        return {
          centerView,
          ...from,
          ...panel,
          leftTab: area,
          leftCollapsed: area === "ideas" ? true : s.leftCollapsed,
        };
      }
      return {
        centerView,
        ...from,
        ...panel,
        leftTab:
          centerView === "notes" &&
          (s.leftTab === "tasks" ||
            s.leftTab === "ideas" ||
            s.leftTab === "meetings" ||
            s.leftTab === "plans")
            ? "files"
            : s.leftTab,
      };
    });
  },
  focusChatNonce: 0,
  focusSearchNonce: 0,
  searchSeed: "",

  openArea: (area) => {
    // The ideas are cards in the middle: the list at the left would show the same thing twice.
    set({ leftTab: area, leftCollapsed: area === "ideas", centerView: area });
  },
  openStart: () => {
    set({ centerView: "start" });
  },
  // The start page is shown without side panels: asking for a panel leaves it for the notes.
  setLeftTab: (leftTab) => {
    set((s) => ({ leftTab, leftCollapsed: false, centerView: leavingStart(s.centerView) }));
  },
  setRightTab: (rightTab) => {
    set((s) => ({
      rightTab,
      rightOpenedForTask: rightTab === "task" && (s.rightCollapsed || s.rightOpenedForTask),
      rightCollapsed: false,
      // A page tab (History, Outline…) is about the page: from another area it goes to the page.
      centerView: PAGE_TABS.includes(rightTab) ? "notes" : leavingStart(s.centerView),
    }));
  },
  toggleLeft: () => {
    set((s) =>
      s.centerView === "start"
        ? { centerView: "notes", leftCollapsed: false }
        : { leftCollapsed: !s.leftCollapsed },
    );
  },
  toggleRight: () => {
    set((s) =>
      s.centerView === "start"
        ? { centerView: "notes", rightCollapsed: false }
        : { rightCollapsed: !s.rightCollapsed },
    );
  },
  planToOpen: null,
  openPlan: (path) => {
    set({ planToOpen: path });
    get().openArea("plans");
  },
  clearPlanToOpen: () => {
    set({ planToOpen: null });
  },
  planFromProjectFolder: null,
  planFromProject: (folder) => {
    set({ planFromProjectFolder: folder });
    get().openArea("plans");
  },
  clearPlanFromProject: () => {
    set({ planFromProjectFolder: null });
  },
  focusChat: () => {
    set((s) => ({ askOpen: true, focusChatNonce: s.focusChatNonce + 1 }));
  },
  focusSearch: (seed) => {
    set((s) => ({
      leftTab: "search",
      leftCollapsed: false,
      centerView: leavingStart(s.centerView),
      focusSearchNonce: s.focusSearchNonce + 1,
      searchSeed: seed ?? s.searchSeed,
    }));
  },
});
