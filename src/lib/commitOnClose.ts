import { api } from "@/lib/api";
import { flushPendingWrites } from "@/lib/flush";
import { isMarkdown } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settingsStore";
import { reportError } from "@/stores/uiStore";

/**
 * When Settings say so, closing a page saves a version of it in the history (as Ctrl+S does).
 * The page is written first, so the version has what was typed.
 */
export function commitOnClose(path: string): void {
  if (useSettingsStore.getState().settings?.git.commitOnClose !== true) return;
  if (!isMarkdown(path)) return;
  void flushPendingWrites()
    .then(() => api.commitNow({ kind: "save", detail: path }, [path]))
    .catch(reportError);
}
