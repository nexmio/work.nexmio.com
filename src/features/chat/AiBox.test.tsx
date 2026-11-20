import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./ChatPanel", () => ({
  ChatPanel: ({ onClose }: { onClose: () => void }) => (
    <div>
      <textarea aria-label="Message the AI" />
      <button type="button" onClick={onClose}>
        Close the chat
      </button>
    </div>
  ),
}));

import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";
import { AiBoxButton } from "@/components/layout/AiBoxButton";
import { AiBox } from "./AiBox";

describe("the AI box", () => {
  beforeEach(() => {
    useUiStore.setState({ askOpen: false, centerView: "start", rightCollapsed: true });
    useChatStore.setState({ streaming: false });
  });

  it("opens from AI in the top bar over the start page, and closes with Esc", async () => {
    render(
      <>
        <AiBoxButton />
        <AiBox />
      </>,
    );
    const user = userEvent.setup();
    expect(screen.queryByRole("complementary", { name: "AI" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "AI" }));
    expect(screen.getByRole("complementary", { name: "AI" })).toBeVisible();
    expect(useUiStore.getState().centerView).toBe("start");
    await user.type(screen.getByLabelText("Message the AI"), "Half a question");
    await user.keyboard("{Escape}");
    expect(useUiStore.getState().askOpen).toBe(false);
    // Kept, hidden, so the half-written question is still there when it opens again.
    await user.click(screen.getByRole("button", { name: "AI" }));
    expect(screen.getByLabelText("Message the AI")).toHaveValue("Half a question");
  });

  it("× closes it, and AI in the top bar closes it again", async () => {
    useUiStore.setState({ askOpen: true });
    render(
      <>
        <AiBoxButton />
        <AiBox />
      </>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Close the chat" }));
    expect(useUiStore.getState().askOpen).toBe(false);
    await user.click(screen.getByRole("button", { name: "AI" }));
    expect(screen.getByRole("button", { name: "AI" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "AI" }));
    expect(useUiStore.getState().askOpen).toBe(false);
  });

  it("shows a dot on AI while an answer is written and the box is closed", () => {
    useChatStore.setState({ streaming: true });
    render(<AiBoxButton />);
    expect(screen.getByTestId("ai-streaming-dot")).toBeInTheDocument();
  });
});
