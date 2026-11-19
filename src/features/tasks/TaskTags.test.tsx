import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";

const apiMock = vi.hoisted(() => ({
  taskSetTag: vi.fn(),
  noteSetTag: vi.fn(),
  allTags: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));

import { EpicTags, TaskTags } from "./TaskTags";
import { useTaskStore } from "@/stores/taskStore";

const task = makeTask({ path: "Tasks/Acme.md", key: "a", tags: ["juridisk"] });

describe("TaskTags and EpicTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.allTags.mockResolvedValue([{ tag: "kunde-x", count: 3 }]);
    useTaskStore.setState({
      tasks: [task],
      epics: [
        { path: "Tasks/Acme.md", title: "Acme", source: null, description: "", tags: ["kunde-x"] },
      ],
    });
  });

  it("a task shows its own tags and the ones from its epic", () => {
    render(<TaskTags task={task} />);
    expect(screen.getByRole("button", { name: "Take the tag juridisk off" })).toBeInTheDocument();
    expect(screen.getByText("#kunde-x")).toHaveAttribute("title", "From the epic");
  });

  it("puts a tag on a task, written in its line", async () => {
    apiMock.taskSetTag.mockResolvedValue([{ ...task, tags: ["juridisk", "intern"] }]);
    render(<TaskTags task={task} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add a tag" }));
    await user.type(screen.getByLabelText("New tag"), "intern{Enter}");
    await waitFor(() => {
      expect(apiMock.taskSetTag).toHaveBeenCalledWith(
        task.path,
        task.line,
        task.key,
        "intern",
        true,
      );
    });
  });

  it("puts a tag on an epic and keeps the tags that came back without epic itself", async () => {
    apiMock.noteSetTag.mockResolvedValue(["epic", "kunde-x", "juridisk"]);
    render(<EpicTags path="Tasks/Acme.md" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add a tag" }));
    await user.type(screen.getByLabelText("New tag"), "juridisk{Enter}");
    await waitFor(() => {
      expect(useTaskStore.getState().epics[0]?.tags).toEqual(["kunde-x", "juridisk"]);
    });
    expect(apiMock.noteSetTag).toHaveBeenCalledWith("Tasks/Acme.md", "juridisk", true);
  });
});
