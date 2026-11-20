import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { todayIso } from "@/lib/taskLogic";
import { useMeetingStore } from "@/stores/meetingStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { makeTask } from "@/test/taskFixtures";
import { WeekWidget } from "./WeekWidget";

describe("This week", () => {
  beforeEach(() => {
    useMeetingStore.setState({ loaded: true, meetings: [] });
    useUiStore.setState({ centerView: "start" });
  });

  it("says what was done this week and opens Look back", async () => {
    useTaskStore.setState({
      tasks: [makeTask({ done: true, history: [{ date: todayIso(), text: "Done" }] })],
      epics: [],
    });
    render(<WeekWidget />);
    expect(screen.getByText("1 done · no time logged · 0 meetings")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: /Look back/ }));
    expect(useUiStore.getState().centerView).toBe("lookback");
  });
});
