import { startCompletion } from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";
import { useWorkspaceStore, type PaneId } from "@/stores/workspaceStore";

const views = new Map<PaneId, EditorView>();

/** Remembers the editor of a pane (or forgets it with `null`), so panels can reach it. */
export function registerView(pane: PaneId, view: EditorView | null): void {
  if (view === null) views.delete(pane);
  else views.set(pane, view);
}

/** The editor of the pane that has the focus, if it is open. */
export function focusedView(): EditorView | null {
  const pane = useWorkspaceStore.getState().layout.focused;
  return views.get(pane) ?? views.get("primary") ?? null;
}

/**
 * Changes a page where it is shown in an editor, as if typed, so it is saved as usual and Ctrl+Z
 * takes it back. False when no editor shows the page with exactly the text `expected`.
 */
export function changeOpenPage(
  path: string,
  expected: string,
  from: number,
  to: number,
  insert: string,
): boolean {
  for (const pane of useWorkspaceStore.getState().layout.panes) {
    const view = views.get(pane.id);
    if (pane.active !== path || !view || view.state.doc.toString() !== expected) continue;
    view.dispatch({ changes: { from, to, insert }, userEvent: "input.ai" });
    return true;
  }
  return false;
}

/** Types a `#` at the cursor of the focused editor and opens the list of tags you already use. */
export function startTag(): void {
  const view = focusedView();
  if (!view) return;
  const at = view.state.selection.main.head;
  const lead = at > 0 && !/\s/.test(view.state.sliceDoc(at - 1, at)) ? " " : "";
  view.dispatch({
    changes: { from: at, insert: `${lead}#` },
    selection: { anchor: at + lead.length + 1 },
  });
  view.focus();
  startCompletion(view);
}

/** Moves the cursor of the focused editor to the start of a line (0-based) and shows it. */
export function goToLine(line: number): void {
  const view = focusedView();
  if (!view) return;
  const n = Math.min(Math.max(1, line + 1), view.state.doc.lines);
  const pos = view.state.doc.line(n).from;
  view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
  view.focus();
}
