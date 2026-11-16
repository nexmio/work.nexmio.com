import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "./uiStore";

describe("uiStore: the chat is a tab of the right panel", () => {
  beforeEach(() => {
    useUiStore.setState({
      rightTab: "outline",
      rightCollapsed: true,
      askOpen: false,
      centerView: "notes",
      focusChatNonce: 0,
    });
  });

  it("focusChat opens the right panel on the AI tab and asks the box for the focus", () => {
    useUiStore.getState().focusChat();
    const s = useUiStore.getState();
    expect(s.rightTab).toBe("ai");
    expect(s.rightCollapsed).toBe(false);
    expect(s.askOpen).toBe(true);
    expect(s.focusChatNonce).toBe(1);
  });

  it("focusChat leaves the start page for the pages", () => {
    useUiStore.getState().openStart();
    useUiStore.getState().focusChat();
    expect(useUiStore.getState().centerView).toBe("notes");
  });

  it("setAskOpen(false) goes back to the outline only when the AI tab was showing", () => {
    useUiStore.getState().setAskOpen(true);
    useUiStore.getState().setAskOpen(false);
    expect(useUiStore.getState().rightTab).toBe("outline");
    expect(useUiStore.getState().askOpen).toBe(false);
    useUiStore.setState({ rightTab: "links" });
    useUiStore.getState().setAskOpen(false);
    expect(useUiStore.getState().rightTab).toBe("links");
  });

  it("closing and reopening the panel keeps askOpen true only for the AI tab", () => {
    useUiStore.getState().focusChat();
    useUiStore.getState().toggleRight();
    expect(useUiStore.getState().askOpen).toBe(false);
    useUiStore.getState().toggleRight();
    expect(useUiStore.getState().askOpen).toBe(true);
    useUiStore.getState().setRightTab("links");
    expect(useUiStore.getState().askOpen).toBe(false);
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
