import { create } from "zustand";
import { api } from "@/lib/api";

/**
 * Which pages are plans, so places outside the Plans area (the project rows in Files) can say
 * whether a project has a plan without reading the Plans area's own state. The Plans area keeps
 * it up to date when it reads its list; `load` reads it on its own.
 */
interface PlanIndexState {
  /** The paths of the pages that are plans. */
  paths: string[];
  loaded: boolean;
  setPaths: (paths: string[]) => void;
  load: () => Promise<void>;
}

/** The tag that makes a page a plan (the same word the Plans area uses). */
const PLAN_TAG = "plan";

export const usePlanIndex = create<PlanIndexState>((set) => ({
  paths: [],
  loaded: false,
  setPaths: (paths) => {
    set({ paths, loaded: true });
  },
  load: async () => {
    try {
      const notes = await api.taggedNotes(PLAN_TAG);
      set({ paths: notes.map((n) => n.path), loaded: true });
    } catch {
      /* the project rows just show no plan line until the next try */
    }
  },
}));
