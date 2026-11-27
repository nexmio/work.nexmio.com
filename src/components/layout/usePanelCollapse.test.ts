import { renderHook } from "@testing-library/react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { describe, expect, it, vi } from "vitest";
import { usePanelCollapse } from "./usePanelCollapse";

describe("usePanelCollapse", () => {
  it("sets a panel again when it comes back to the screen", () => {
    const panel = { collapse: vi.fn(), expand: vi.fn() };
    const ref: { current: ImperativePanelHandle | null } = {
      current: panel as unknown as ImperativePanelHandle,
    };
    const { rerender } = renderHook(
      ({ collapsed, present }) => {
        usePanelCollapse(ref, collapsed, present);
      },
      { initialProps: { collapsed: false, present: true } },
    );
    expect(panel.expand).not.toHaveBeenCalled();
    rerender({ collapsed: false, present: false });
    rerender({ collapsed: true, present: false });
    expect(panel.collapse).not.toHaveBeenCalled();
    rerender({ collapsed: true, present: true });
    expect(panel.collapse).toHaveBeenCalledTimes(1);
  });
});
