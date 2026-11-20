import { usePlanIndex } from "@/stores/planIndexStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

/** True when the page at `path` is a plan (it has the tag `plan`). */
export function isPlan(path: string): boolean {
  return usePlanIndex.getState().paths.includes(path);
}

/**
 * Opens the page an epic was made from: a plan opens in the Plans area (on its map), any other
 * page in the editor.
 */
export function openFrom(path: string): void {
  if (isPlan(path)) useUiStore.getState().openPlan(path);
  else void useVaultStore.getState().openNote(path);
}
