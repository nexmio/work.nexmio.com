import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { StartTimer, TimerPanel } from "./TimerPanel";
import { useTaskStore } from "@/stores/taskStore";
import { useTimerStore } from "@/stores/timerStore";

const epics = [
  { path: "Tasks/Acme.md", title: "Acme", source: null, description: "", tags: ["kunde-x"] },
  { path: "Tasks/Home.md", title: "Home", source: null, description: "", tags: [] },
];
const task = makeTask({ path: "Tasks/Acme.md", title: "Write the offer", line: 3, key: "a" });

describe("TimerPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    useTaskStore.setState({ tasks: [task], epics, epicOrder: [] });
    useTimerStore.setState({ running: null });
  });

  it("starts a timer on a task you have", async () => {
    const start = vi.fn().mockResolvedValue(undefined);
    useTimerStore.setState({ start });
    render(<StartTimer />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Start the timer on Write the offer" }));
    expect(start).toHaveBeenCalledTimes(1);
    expect(start.mock.calls[0]?.[0]).toMatchObject({ title: "Write the offer" });
  });

  it("starts a timer on a new task in the epic that has the chosen tag", async () => {
    const startNew = vi.fn().mockResolvedValue(true);
    useTimerStore.setState({ startNew });
    render(<StartTimer />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("What are you doing?"), "Call Anna");
    await user.click(screen.getByRole("button", { name: "#kunde-x" }));
    expect(screen.getByLabelText("In the epic")).toHaveValue("Tasks/Acme.md");
    await user.click(screen.getByRole("button", { name: "Start timer" }));
    expect(startNew).toHaveBeenCalledWith({
      title: "Call Anna",
      epicPath: "Tasks/Acme.md",
    });
  });

  it("starts on a new task without an epic: it goes into Loose tasks", async () => {
    const startNew = vi.fn().mockResolvedValue(true);
    useTimerStore.setState({ startNew });
    render(<StartTimer />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("What are you doing?"), "Call Anna");
    expect(screen.getByLabelText("In the epic")).toHaveValue("Loose tasks.md");
    await user.click(screen.getByRole("button", { name: "Start timer" }));
    expect(startNew).toHaveBeenCalledWith({ title: "Call Anna", epicPath: "Loose tasks.md" });
  });

  it("will not start without a name, and has no count down", () => {
    useTaskStore.setState({ tasks: [], epics: [] });
    render(<StartTimer />);
    expect(screen.getByRole("button", { name: "Start timer" })).toBeDisabled();
    expect(screen.queryByText(/Count down/)).toBeNull();
  });

  it("shows a running timer and stops it with the note", async () => {
    const stop = vi.fn().mockResolvedValue(true);
    useTimerStore.setState({
      stop,
      running: {
        path: task.path,
        line: task.line,
        title: task.title,
        startedAt: Date.now() - 42 * 60_000,
      },
    });
    render(<TimerPanel />);
    expect(screen.getByRole("timer")).toHaveTextContent("00:42:");
    expect(screen.getByText(/Task in Acme/)).toHaveTextContent("#kunde-x");
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Note for the log/), "Called Anna");
    await user.click(screen.getByRole("button", { name: "Stop" }));
    expect(stop).toHaveBeenCalledWith("Called Anna");
  });
});
