import type { DialogsSlice } from "./dialogs";
import type { NoticesSlice } from "./notices";
import type { PanelsSlice } from "./panels";
import type { PrefsSlice } from "./prefs";

/** Everything the UI store holds: one part per file in this folder. */
export type UiState = PrefsSlice & NoticesSlice & PanelsSlice & DialogsSlice;
