import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";
import { RightTabs } from "./RightTabs";

const TABS = ["outline", "links", "history", "images", "ai"] as const;

describe("RightTabs", () => {
  beforeEach(() => {
    useUiStore.setState({ rightTab: "outline", rightCollapsed: false, askOpen: false });
    useChatStore.setState({ streaming: false });
  });

  it("shows a tab for each part and marks the chosen one", () => {
    render(<RightTabs tabs={TABS} current="links" />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Outline",
      "Links",
      "History",
      "Images",
      "AI",
    ]);
    expect(screen.getByRole("tab", { name: "Links" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "AI" })).toHaveAttribute("aria-selected", "false");
  });

  it("changes the tab, and the AI tab says the chat is open", async () => {
    render(<RightTabs tabs={TABS} current="outline" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "AI" }));
    expect(useUiStore.getState().rightTab).toBe("ai");
    expect(useUiStore.getState().askOpen).toBe(true);
    await user.click(screen.getByRole("tab", { name: "History" }));
    expect(useUiStore.getState().askOpen).toBe(false);
  });

  it("closes the panel", async () => {
    render(<RightTabs tabs={TABS} current="outline" />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Close the panel" }));
    expect(useUiStore.getState().rightCollapsed).toBe(true);
  });

  it("shows a dot on the AI tab while an answer is being written", () => {
    const { rerender } = render(<RightTabs tabs={TABS} current="outline" />);
    expect(screen.queryByTestId("ai-streaming-dot")).toBeNull();
    useChatStore.setState({ streaming: true });
    rerender(<RightTabs tabs={TABS} current="outline" />);
    expect(screen.getByTestId("ai-streaming-dot")).toBeInTheDocument();
  });
});
