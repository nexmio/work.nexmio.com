import { useEffect, useRef, type RefObject } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";

/**
 * Collapses/expands a panel when `collapsed` changes. Does nothing on mount (the panel starts in
 * its saved state) and tolerates the panel not being measured yet.
 */
export function usePanelCollapse(
  ref: RefObject<ImperativePanelHandle | null>,
  collapsed: boolean,
  /** False while the panel is not on the screen; when it comes back it is set again. */
  present = true,
): void {
  const previous = useRef<boolean | null>(collapsed);
  useEffect(() => {
    if (!present) {
      previous.current = null;
      return;
    }
    if (previous.current === collapsed) return;
    previous.current = collapsed;
    const panel = ref.current;
    if (!panel) return;
    try {
      if (collapsed) panel.collapse();
      else panel.expand();
    } catch {
      /* layout not ready; the next toggle retries */
    }
  }, [ref, collapsed, present]);
}
