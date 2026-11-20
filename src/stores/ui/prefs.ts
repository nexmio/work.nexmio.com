import type { StateCreator } from "zustand";
import type { TimeFormat } from "@/lib/timeFormat";
import type { UiState } from "./state";

const NAV_KEY = "nexmio.navCollapsed";

/** Whether the navigation column is folded to icons (remembered between runs). */
function readNavCollapsed(): boolean {
  try {
    return localStorage.getItem(NAV_KEY) === "1";
  } catch {
    return false;
  }
}

const SOURCE_MODE_KEY = "nexmio.sourceMode";

/** Whether notes are shown as Markdown source (remembered between runs). */
function readSourceMode(): boolean {
  try {
    return localStorage.getItem(SOURCE_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

const TIME_KEY = "nexmio.timeFormat";

/** How times are written (remembered between runs, per computer). */
function readTimeFormat(): TimeFormat {
  try {
    const v = localStorage.getItem(TIME_KEY);
    return v === "24" || v === "12" ? v : "system";
  } catch {
    return "system";
  }
}

const START_KEY = "nexmio.startOnLaunch";

/** Whether Nexmio Work opens on the start page instead of the last note (remembered between runs). */
function readStartOnLaunch(): boolean {
  try {
    return localStorage.getItem(START_KEY) === "1";
  } catch {
    return false;
  }
}

/** Choices kept per computer in the browser storage. */
export interface PrefsSlice {
  /** How times are written: the computer's own way, 24-hour or 12-hour. */
  timeFormat: TimeFormat;
  setTimeFormat: (f: TimeFormat) => void;
  /** Open the start page when Nexmio Work starts, instead of the last note. */
  startOnLaunch: boolean;
  setStartOnLaunch: (on: boolean) => void;
  /** True = the editor shows the Markdown source instead of the live preview. */
  sourceMode: boolean;
  setSourceMode: (on: boolean) => void;
  /** The navigation column at the left edge shows only icons. */
  navCollapsed: boolean;
  toggleNav: () => void;
}

export const prefsSlice: StateCreator<UiState, [], [], PrefsSlice> = (set) => ({
  timeFormat: readTimeFormat(),
  setTimeFormat: (timeFormat) => {
    try {
      localStorage.setItem(TIME_KEY, timeFormat);
    } catch {
      /* the choice just is not remembered */
    }
    set({ timeFormat });
  },
  startOnLaunch: readStartOnLaunch(),
  setStartOnLaunch: (startOnLaunch) => {
    try {
      localStorage.setItem(START_KEY, startOnLaunch ? "1" : "0");
    } catch {
      /* the choice just is not remembered */
    }
    set({ startOnLaunch });
  },
  sourceMode: readSourceMode(),
  setSourceMode: (sourceMode) => {
    try {
      localStorage.setItem(SOURCE_MODE_KEY, sourceMode ? "1" : "0");
    } catch {
      /* the choice just is not remembered */
    }
    set({ sourceMode });
  },
  navCollapsed: readNavCollapsed(),
  toggleNav: () => {
    set((s) => {
      const navCollapsed = !s.navCollapsed;
      try {
        localStorage.setItem(NAV_KEY, navCollapsed ? "1" : "0");
      } catch {
        /* the choice just is not remembered */
      }
      return { navCollapsed };
    });
  },
});
