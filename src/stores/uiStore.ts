import { create } from "zustand";
import { toApiError } from "@/lib/api";
import { dialogsSlice } from "./ui/dialogs";
import { noticesSlice } from "./ui/notices";
import { panelsSlice } from "./ui/panels";
import { prefsSlice } from "./ui/prefs";
import type { UiState } from "./ui/state";

export {
  isTasksView,
  type CenterView,
  type ImagePreview,
  type LeftTab,
  type LinkUpdateChoice,
  type Notice,
  type ProjectDialogState,
  type RightTab,
  type Toast,
} from "./ui/types";
export type { UiState } from "./ui/state";

/** What is open where in the window. Its parts are in . */
export const useUiStore = create<UiState>()((...a) => ({
  ...prefsSlice(...a),
  ...noticesSlice(...a),
  ...panelsSlice(...a),
  ...dialogsSlice(...a),
}));

/**
 * Shows an error. A name that is already taken gets a dialog, because a toast is easy to miss;
 * everything else is a toast.
 */
export function reportError(e: unknown): void {
  const err = toApiError(e);
  if (err.code === "Conflict") {
    useUiStore.getState().showNotice({
      title: "That cannot be done",
      details: [err.message],
      hint: "Nothing was changed.",
    });
    return;
  }
  if (err.code === "AlreadyExists") {
    useUiStore.getState().showNotice({
      title: "That name is already taken",
      details: [err.message],
      hint: "Nothing was changed for these. Rename one of them, or choose another name, and try again.",
    });
    return;
  }
  useUiStore.getState().toast(err.message, "error");
}
