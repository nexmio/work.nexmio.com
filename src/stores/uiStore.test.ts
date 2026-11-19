import { describe, expect, it } from "vitest";
import { useUiStore } from "./uiStore";

describe("the right panel and a task opened as a full page", () => {
  it("goes shut again when it was shut before the task was shown", () => {
    useUiStore.setState({ centerView: "tasks", rightCollapsed: true, rightOpenedForTask: false });
    useUiStore.getState().setRightTab("task");
    expect(useUiStore.getState().rightCollapsed).toBe(false);
    useUiStore.getState().setCenterView("task");
    expect(useUiStore.getState().rightCollapsed).toBe(true);
  });

  it("stays open when it was open before", () => {
    useUiStore.setState({ centerView: "tasks", rightCollapsed: false, rightOpenedForTask: false });
    useUiStore.getState().setRightTab("task");
    useUiStore.getState().setCenterView("task");
    expect(useUiStore.getState().rightCollapsed).toBe(false);
  });
});
