import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { useTaskStore } from "@/stores/taskStore";
import { useTimerStore } from "@/stores/timerStore";
import { TimePage } from "./TimePage";

describe("TimePage: starting a timer", () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: [], epics: [], epicOrder: [] });
  });

  it("has the form that starts a timer when none runs", () => {
    useTimerStore.setState({ running: null });
    render(<TimePage />);
    expect(screen.getByRole("button", { name: "Start timer" })).toBeInTheDocument();
  });

  it("points to the Timer tab when one runs", () => {
    useTimerStore.setState({
      running: { path: "Loose tasks.md", line: 2, title: "Call Anna", startedAt: Date.now() },
    });
    render(<TimePage />);
    expect(screen.queryByRole("button", { name: "Start timer" })).toBeNull();
    expect(screen.getByText(/Call Anna/)).toBeInTheDocument();
  });
});
