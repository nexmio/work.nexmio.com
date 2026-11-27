import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";

const apiMock = vi.hoisted(() => ({
  taskSetDone: vi.fn(),
  taskSetMeta: vi.fn(),
  taskHistoryAdd: vi.fn(),
  taskAddStep: vi.fn(),
  taskAddLog: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));

import { TaskDetail } from "./TaskDetail";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";

const task = makeTask({
  path: "Tasks/VPN.md",
  line: 3,
  title: "Send the offer",
  status: "doing",
  steps: [
    { line: 4, text: "Collect prices", done: true, key: "s1" },
    { line: 5, text: "Write the offer", done: false, key: "s2" },
  ],
  log: [{ line: 6, date: "2026-10-28", text: "Called Acme", key: "l1" }],
});

describe("TaskDetail (the right panel of the Tasks area)", () => {
  beforeEach(() => {
    for (const f of Object.values(apiMock))
      f.mockReset().mockImplementation(() => Promise.resolve([task]));
    useTaskStore.setState({
      tasks: [task],
      selected: { path: task.path, line: task.line, title: task.title },
    });
  });

  it("asks for a task when none is chosen", () => {
    useTaskStore.setState({ selected: null });
    render(<TaskDetail />);
    expect(screen.getByText(/Choose a task to see its steps/)).toBeInTheDocument();
  });

  it("shows the title, the status, the steps with the next one marked, and what happened", () => {
    render(<TaskDetail />);
    expect(screen.getByText("Send the offer")).toBeInTheDocument();
    // "doing" is called Working on.
    expect(screen.queryByRole("button", { name: "Doing" })).toBeNull();
    expect(screen.getByRole("button", { name: "Working on" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Steps · 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Called Acme")).toBeInTheDocument();
  });

  it("ticks a step and changes the status", async () => {
    render(<TaskDetail />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("checkbox", { name: /Mark as done: Write the offer/ }));
    expect(apiMock.taskSetDone).toHaveBeenCalledWith("Tasks/VPN.md", 5, "s2", true);
    await user.click(screen.getByRole("button", { name: "Waiting" }));
    expect(apiMock.taskSetMeta).toHaveBeenCalled();
  });

  it("adds a step and a line of what happened", async () => {
    render(<TaskDetail />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Add a step"), "Get it approved{Enter}");
    expect(apiMock.taskAddStep).toHaveBeenCalledWith("Tasks/VPN.md", 3, "key-1", "Get it approved");
    await user.type(screen.getByLabelText("Write what happened"), "Sent it{Enter}");
    expect(apiMock.taskAddLog).toHaveBeenCalled();
  });

  it("opens the task as a full page", async () => {
    render(<TaskDetail />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Open as full page" }));
    expect(useUiStore.getState().centerView).toBe("task");
  });
});
