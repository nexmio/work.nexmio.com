import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "./uiStore";

describe("uiStore: the AI box and the right panel", () => {
  beforeEach(() => {
    useUiStore.setState({
      rightTab: "outline",
      rightCollapsed: true,
      askOpen: false,
      centerView: "notes",
      focusChatNonce: 0,
    });
  });

  it("focusChat opens the AI box and asks it for the focus, and changes nothing under it", () => {
    useUiStore.getState().focusChat();
    const s = useUiStore.getState();
    expect(s.askOpen).toBe(true);
    expect(s.focusChatNonce).toBe(1);
    expect(s.rightTab).toBe("outline");
    expect(s.rightCollapsed).toBe(true);
  });

  it("the AI box opens over the start page, which stays", () => {
    useUiStore.getState().openStart();
    useUiStore.getState().focusChat();
    expect(useUiStore.getState().centerView).toBe("start");
  });

  it("closing the AI box leaves the right panel as it was", () => {
    useUiStore.setState({ rightTab: "links", rightCollapsed: false });
    useUiStore.getState().setAskOpen(true);
    useUiStore.getState().setAskOpen(false);
    expect(useUiStore.getState()).toMatchObject({
      askOpen: false,
      rightTab: "links",
      rightCollapsed: false,
    });
  });

  it("closing and opening the right panel or changing its tab leaves the AI box open", () => {
    useUiStore.getState().focusChat();
    useUiStore.getState().toggleRight();
    useUiStore.getState().toggleRight();
    useUiStore.getState().setRightTab("links");
    expect(useUiStore.getState().askOpen).toBe(true);
  });

  it("a page tab from another area goes to the page, and an area tab stays in its area", () => {
    useUiStore.setState({ centerView: "tasks" });
    useUiStore.getState().setRightTab("history");
    expect(useUiStore.getState().centerView).toBe("notes");
    useUiStore.setState({ centerView: "tasks" });
    useUiStore.getState().setRightTab("task");
    expect(useUiStore.getState().centerView).toBe("tasks");
  });

  it("remembers the folded navigation", () => {
    useUiStore.setState({ navCollapsed: false });
    useUiStore.getState().toggleNav();
    expect(localStorage.getItem("nexmio.navCollapsed")).toBe("1");
    useUiStore.getState().toggleNav();
    expect(localStorage.getItem("nexmio.navCollapsed")).toBe("0");
  });

  it("asks the Plans area for a new plan", () => {
    useUiStore.setState({ newPlanNonce: 0 });
    useUiStore.getState().requestNewPlan();
    expect(useUiStore.getState().newPlanNonce).toBe(1);
    expect(useUiStore.getState().centerView).toBe("plans");
  });
});
