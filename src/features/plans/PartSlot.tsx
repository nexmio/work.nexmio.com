import { create } from "zustand";

/**
 * Where the chosen part is shown: a box in the "Part" tab of the right panel. The map knows
 * what is chosen and how its parts are arranged, so it draws the part's actions into this box
 * (`createPortal`) instead of keeping its own column.
 */
const useSlot = create<{ el: HTMLElement | null }>(() => ({ el: null }));

/** The element the chosen part is drawn into, or null while the tab is not shown. */
export function usePartSlot(): HTMLElement | null {
  return useSlot((s) => s.el);
}

/** The empty box in the right panel that the Plans area fills. */
export function PartSlot() {
  return (
    <div
      data-testid="part-slot"
      className="h-full min-h-0 overflow-auto"
      ref={(el) => {
        if (useSlot.getState().el !== el) useSlot.setState({ el });
      }}
    />
  );
}
