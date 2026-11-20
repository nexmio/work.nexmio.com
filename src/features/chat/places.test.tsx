import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { useChatStore, type ChatMessage } from "@/stores/chatStore";
import { useMeetingStore } from "@/stores/meetingStore";
import { useUiStore } from "@/stores/uiStore";
import { Bubble } from "./Bubble";
import { openPlace } from "./places";

const answer = (over: Partial<ChatMessage>): ChatMessage => ({
  id: 1,
  role: "assistant",
  content: "Choose the project under Project.",
  activity: ["Looked in the help: templates"],
  proposalSetId: null,
  error: null,
  mentions: [],
  ...over,
});

describe("Show me", () => {
  beforeEach(() => {
    useUiStore.setState({ centerView: "notes", meetingFormOpen: false });
  });

  it("shows a button for each place the assistant offered, and it opens the place", async () => {
    render(<Bubble m={answer({ places: [{ place: "new-meeting", label: "New meeting" }] })} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /Show me: New meeting/ }));
    expect(useUiStore.getState().meetingFormOpen).toBe(true);
  });

  it("knows the places of the backend's list, and leaves an unknown one alone", () => {
    openPlace("projects");
    expect(useUiStore.getState().centerView).toBe("plans");
    openPlace("decisions");
    expect(useUiStore.getState().centerView).toBe("meetings");
    expect(useMeetingStore.getState().decisions).toBe(true);
    openPlace("nowhere");
    expect(useUiStore.getState().centerView).toBe("meetings");
  });

  it("collects the places of a turn from the events, once each", () => {
    useChatStore.setState({ messages: [answer({ places: undefined })], streaming: true });
    const { applyEvent } = useChatStore.getState();
    applyEvent({ type: "place", place: "tasks", label: "Tasks" });
    applyEvent({ type: "place", place: "tasks", label: "Tasks" });
    expect(useChatStore.getState().messages[0]?.places).toEqual([
      { place: "tasks", label: "Tasks" },
    ]);
  });
});
