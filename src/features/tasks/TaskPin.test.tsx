import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({ taskSetPinned: vi.fn() }));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));

import { PinnedWidget } from "@/features/start/widgets";
import { useTaskStore } from "@/stores/taskStore";
import { makeTask } from "@/test/taskFixtures";
import { TaskRow } from "./TaskRow";

describe("pinning a task", () => {
  const task = makeTask({ path: "Tasks/Move.md", title: "Book the van" });
  beforeEach(() => {
    apiMock.taskSetPinned.mockReset();
    useTaskStore.setState({ tasks: [task] });
  });

  it("right-click on a task pins it (kept by page and title), and the card says Unpin after", async () => {
    apiMock.taskSetPinned.mockResolvedValue([{ ...task, pinned: true }]);
    render(
      <ul>
        <TaskRow task={task} />
      </ul>,
    );
    const user = userEvent.setup();
    await user.pointer({ keys: "[MouseRight]", target: screen.getByText("Book the van") });
    await user.click(await screen.findByRole("menuitem", { name: "Pin" }));
    expect(apiMock.taskSetPinned).toHaveBeenCalledWith("Tasks/Move.md", "Book the van", true);
    await waitFor(() => {
      expect(useTaskStore.getState().tasks[0]?.pinned).toBe(true);
    });
  });

  it("a pinned task is under Pinned on the start page, opens, and can be unpinned there", async () => {
    apiMock.taskSetPinned.mockResolvedValue([{ ...task, pinned: false }]);
    useTaskStore.setState({ tasks: [{ ...task, pinned: true }] });
    render(<PinnedWidget />);
    expect(screen.getByTitle("Task in Move")).toHaveTextContent("Book the van");
    await userEvent.setup().click(screen.getByRole("button", { name: "Unpin Book the van" }));
    expect(apiMock.taskSetPinned).toHaveBeenCalledWith("Tasks/Move.md", "Book the van", false);
  });
});
