import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";

const apiMock = vi.hoisted(() => ({
  listTasks: vi.fn(),
  listEpics: vi.fn(),
  epicCreate: vi.fn(),
  epicSetTitle: vi.fn(),
  epicAdopt: vi.fn(),
  taskDelete: vi.fn(),
  taskSetTitle: vi.fn(),
  deletePath: vi.fn(),
  taskSetDone: vi.fn(),
  taskAdd: vi.fn(),
  taskAddStep: vi.fn(),
  taskMove: vi.fn(),
  getEpicOrder: vi.fn(),
  setEpicOrder: vi.fn(),
  taskSetMeta: vi.fn(),
  taskHistoryAdd: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));
vi.mock("@/lib/useAiBlocked", () => ({ useAiBlocked: () => null }));

import { TasksView } from "./TasksView";
import { useTaskStore } from "@/stores/taskStore";
import { useTimerStore } from "@/stores/timerStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { LOOSE_AREA } from "@/lib/taskLogic";

describe("TasksView: one area at a time", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 25));
    localStorage.clear();
    for (const f of Object.values(apiMock)) f.mockReset();
    apiMock.listTasks.mockResolvedValue([
      makeTask({
        path: "Tasks/VPN guide.md",
        line: 3,
        title: "Write the steps",
        made: "2026-10-19",
        steps: [{ line: 4, text: "Draft it", done: true, key: "s1" }],
      }),
      makeTask({
        path: "Tasks/VPN guide.md",
        line: 6,
        key: "k6",
        title: "Test on Linux",
        steps: [{ line: 7, text: "Boot it", done: false, key: "s2" }],
      }),
      makeTask({
        path: "Tasks/VPN guide.md",
        line: 8,
        key: "k8",
        title: "Ask the vendor",
        status: "waiting",
        waitingFor: "the vendor",
      }),
      makeTask({
        path: "Tasks/VPN guide.md",
        line: 9,
        key: "k9",
        title: "Test on a Mac",
        done: true,
      }),
      makeTask({ path: "Tasks/Done one.md", line: 2, title: "Order headsets", done: true }),
      makeTask({ path: "Møder/Acme.md", line: 5, title: "Renew the licence" }),
    ]);
    apiMock.getEpicOrder.mockResolvedValue([]);
    apiMock.setEpicOrder.mockResolvedValue(undefined);
    apiMock.taskSetMeta.mockResolvedValue([]);
    apiMock.taskHistoryAdd.mockResolvedValue([]);
    apiMock.listEpics.mockResolvedValue([
      { path: "Tasks/VPN guide.md", title: "VPN guide", source: "IT/VPN client guide" },
      { path: "Tasks/Done one.md", title: "Office move", source: null },
      { path: "Tasks/Empty.md", title: "Empty one", source: null },
    ]);
    useTaskStore.setState({
      tasks: [],
      epics: [],
      epicOrder: [],
      loaded: false,
      openTasks: {},
      epicPath: null,
      selected: null,
      chosenArea: null,
    });
    // The area that was chosen last is kept per vault, on this computer.
    localStorage.setItem("nexmio.tasksArea:", "Tasks/VPN guide.md");
    useUiStore.setState({ centerView: "tasks", rightTab: "outline" });
    useVaultStore.setState({ activePath: null });
  });

  it("shows only the chosen area, with its progress, and the task to do Now", async () => {
    render(<TasksView />);
    const now = await screen.findByRole("region", { name: "Now" });
    expect(within(now).getByText("Write the steps")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "VPN guide" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText("1 of 4")).toBeInTheDocument();
    // Nothing of the other areas.
    expect(screen.queryByText("Order headsets")).toBeNull();
    expect(screen.queryByText("Renew the licence")).toBeNull();
  });

  it("has no filters, no fold buttons and no Today", async () => {
    render(<TasksView />);
    await screen.findByRole("region", { name: "Now" });
    for (const gone of [/^All$/, /^Doing$/, /^Waiting$/, /Next up/, /Fold all/, /Today/]) {
      expect(screen.queryByRole("button", { name: gone })).toBeNull();
    }
  });

  it("lists After that without chips or dates, and Waiting for others with the reason", async () => {
    render(<TasksView />);
    const after = await screen.findByRole("region", { name: "After that" });
    expect(within(after).getByText("Test on Linux")).toBeInTheDocument();
    expect(within(after).getByText("1 step left")).toBeInTheDocument();
    expect(within(after).queryByText("Doing")).toBeNull();
    const waiting = screen.getByRole("region", { name: "Waiting for others" });
    expect(within(waiting).getByText("Ask the vendor")).toBeInTheDocument();
    expect(within(waiting).getByText("waiting for the vendor")).toBeInTheDocument();
  });

  it("folds the done tasks away and opens them", async () => {
    render(<TasksView />);
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Now" });
    expect(screen.queryByText("Test on a Mac")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Done · 1" }));
    expect(screen.getByText("Test on a Mac")).toBeInTheDocument();
    // A done task is dimmed, never struck through.
    expect(screen.getByText("Test on a Mac").className).not.toContain("line-through");
  });

  it("ticks the whole task when the Now task has no step left", async () => {
    apiMock.taskSetDone.mockResolvedValue([]);
    render(<TasksView />);
    await userEvent.setup().click(await screen.findByRole("button", { name: "Task done" }));
    expect(apiMock.taskSetDone).toHaveBeenCalledWith("Tasks/VPN guide.md", 3, "key-1", true);
  });

  it("ticks the next step when the Now task has one, and shows the step count", async () => {
    apiMock.listTasks.mockResolvedValue([
      makeTask({
        path: "Tasks/VPN guide.md",
        line: 3,
        title: "Write the steps",
        steps: [
          { line: 4, text: "Draft it", done: true, key: "s1" },
          { line: 5, text: "Review it", done: false, key: "s2" },
        ],
      }),
    ]);
    apiMock.taskSetDone.mockResolvedValue([]);
    render(<TasksView />);
    const now = await screen.findByRole("region", { name: "Now" });
    expect(within(now).getByText("Step 2 of 2")).toBeInTheDocument();
    expect(within(now).getByText("Review it")).toBeInTheDocument();
    await userEvent.setup().click(within(now).getByRole("button", { name: "Step done" }));
    expect(apiMock.taskSetDone).toHaveBeenCalledWith("Tasks/VPN guide.md", 5, "s2", true);
  });

  it("says the Now task waits, and shows it in the right panel", async () => {
    render(<TasksView />);
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "I am waiting for someone" }));
    await waitFor(() => {
      expect(apiMock.taskSetMeta).toHaveBeenCalledWith("Tasks/VPN guide.md", 3, "key-1", {
        status: "waiting",
      });
    });
    await waitFor(() => {
      expect(useUiStore.getState().rightTab).toBe("task");
    });
    expect(useTaskStore.getState().selected?.title).toBe("Write the steps");
  });

  it("chooses another task to be Doing", async () => {
    render(<TasksView />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Choose another" }));
    await user.click(await screen.findByRole("menuitem", { name: "Test on Linux" }));
    await waitFor(() => {
      expect(apiMock.taskSetMeta).toHaveBeenCalledWith("Tasks/VPN guide.md", 6, "k6", {
        status: "doing",
        waitingFor: null,
        after: null,
      });
    });
  });

  it("opens a task in the right panel when its title is pressed", async () => {
    render(<TasksView />);
    await userEvent.setup().click(await screen.findByRole("button", { name: "Test on Linux" }));
    expect(useTaskStore.getState().selected?.title).toBe("Test on Linux");
    expect(useUiStore.getState().rightTab).toBe("task");
    expect(useUiStore.getState().rightCollapsed).toBe(false);
  });

  it("starts a timer on the task to do now in the area", async () => {
    const start = vi.fn().mockResolvedValue(undefined);
    useTimerStore.setState({ start });
    render(<TasksView />);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Start the timer on Write the steps" }),
    );
    expect(start).toHaveBeenCalledTimes(1);
    expect(start.mock.calls[0]?.[0]).toMatchObject({ title: "Write the steps" });
  });

  it("shows the loose tasks of ordinary pages apart, and makes a page an epic", async () => {
    apiMock.epicAdopt.mockResolvedValue({ path: "Møder/Acme.md", title: "Acme", source: null });
    apiMock.taskSetDone.mockResolvedValue([
      makeTask({ path: "Møder/Acme.md", line: 5, title: "Renew the licence", done: true }),
    ]);
    localStorage.setItem("nexmio.tasksArea:", LOOSE_AREA);
    render(<TasksView />);
    const user = userEvent.setup();
    expect(await screen.findByRole("heading", { name: "Loose tasks" })).toBeInTheDocument();
    const acme = screen.getByRole("region", { name: "Acme" });
    await user.click(
      within(acme).getByRole("checkbox", { name: /Mark as done: Renew the licence/ }),
    );
    expect(apiMock.taskSetDone).toHaveBeenCalledWith("Møder/Acme.md", 5, "key-1", true);
    await user.click(within(acme).getByRole("button", { name: "Make an epic" }));
    expect(apiMock.epicAdopt).toHaveBeenCalledWith("Møder/Acme.md");
  });

  it("adds a task to the area and a step to a task in the list", async () => {
    // The answer of a change is the tasks of that note as they are now.
    const same = () =>
      Promise.resolve(useTaskStore.getState().tasks.filter((t) => t.path === "Tasks/VPN guide.md"));
    apiMock.taskAdd.mockImplementation(same);
    apiMock.taskAddStep.mockImplementation(same);
    render(<TasksView />);
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText("Add a task to VPN guide"),
      "Test on Windows{Enter}",
    );
    expect(apiMock.taskAdd.mock.calls[0]?.[0]).toBe("Test on Windows");
    expect(apiMock.taskAdd.mock.calls[0]?.[3]).toBe("Tasks/VPN guide.md");
    await user.click(screen.getByRole("button", { name: "Show the steps of Test on Linux" }));
    await user.type(screen.getByLabelText("Add a step to Test on Linux"), "Log it{Enter}");
    expect(apiMock.taskAddStep).toHaveBeenCalledWith("Tasks/VPN guide.md", 6, "k6", "Log it");
  });

  it("makes a new epic from the menu, and shows it", async () => {
    apiMock.epicCreate.mockResolvedValue({
      path: "Tasks/New one.md",
      title: "New one",
      source: null,
    });
    render(<TasksView />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "More for this area" }));
    await user.click(await screen.findByRole("menuitem", { name: "New epic…" }));
    await user.type(screen.getByLabelText("Name"), "New one{Enter}");
    expect(apiMock.epicCreate).toHaveBeenCalledWith("New one");
    await waitFor(() => {
      expect(useTaskStore.getState().chosenArea).toBe("Tasks/New one.md");
    });
  });

  it("renames and deletes the epic from the menu, never from a field on the page", async () => {
    apiMock.epicSetTitle.mockResolvedValue({
      path: "Tasks/VPN guide.md",
      title: "VPN",
      source: null,
      description: "",
    });
    apiMock.deletePath.mockResolvedValue(undefined);
    render(<TasksView />);
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Now" });
    expect(screen.queryByRole("textbox", { name: /^Name/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: "More for this area" }));
    await user.click(await screen.findByRole("menuitem", { name: "Rename this epic…" }));
    const field = screen.getByLabelText("Name");
    await user.clear(field);
    await user.type(field, "VPN{Enter}");
    expect(apiMock.epicSetTitle).toHaveBeenCalledWith("Tasks/VPN guide.md", "VPN");

    await user.click(screen.getByRole("button", { name: "More for this area" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete this epic…" }));
    expect(apiMock.deletePath).not.toHaveBeenCalled();
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(apiMock.deletePath).toHaveBeenCalledWith("Tasks/VPN guide.md");
    });
  });

  it("moves the area up and down among the areas", async () => {
    apiMock.listEpics.mockResolvedValue([
      { path: "Tasks/Inbox.md", title: "Inbox", source: null },
      { path: "Tasks/VPN guide.md", title: "VPN guide", source: null },
      { path: "Tasks/Office.md", title: "Office move", source: null },
    ]);
    apiMock.listTasks.mockResolvedValue([
      makeTask({ path: "Tasks/Inbox.md", line: 2, title: "Call the bank", key: "i1" }),
      makeTask({ path: "Tasks/VPN guide.md", line: 3, title: "Write the steps", key: "a" }),
      makeTask({ path: "Tasks/Office.md", line: 2, title: "Order desks" }),
    ]);
    render(<TasksView />);
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Now" });
    await user.click(screen.getByRole("button", { name: "More for this area" }));
    await user.click(await screen.findByRole("menuitem", { name: "Move this area up" }));
    expect(apiMock.setEpicOrder).toHaveBeenCalledWith(["Tasks/VPN guide.md", "Tasks/Office.md"]);
  });

  it("moves a task down, and deletes one only after the question", async () => {
    apiMock.taskMove.mockImplementation(() => Promise.resolve(useTaskStore.getState().tasks));
    apiMock.taskDelete.mockResolvedValue([]);
    apiMock.listTasks.mockResolvedValue([
      makeTask({ path: "Tasks/VPN guide.md", line: 3, key: "a", title: "First" }),
      makeTask({ path: "Tasks/VPN guide.md", line: 4, key: "b", title: "Second" }),
      makeTask({ path: "Tasks/VPN guide.md", line: 5, key: "c", title: "Third" }),
    ]);
    render(<TasksView />);
    const user = userEvent.setup();
    const after = await screen.findByRole("region", { name: "After that" });
    await user.click(within(after).getByRole("button", { name: "Move Second down" }));
    expect(apiMock.taskMove).toHaveBeenCalledWith("Tasks/VPN guide.md", 4, "b", false);
    await user.click(within(after).getByRole("button", { name: "Delete the task Second" }));
    expect(apiMock.taskDelete).not.toHaveBeenCalled();
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    expect(apiMock.taskDelete).toHaveBeenCalledWith("Tasks/VPN guide.md", 4, expect.any(String));
  });

  it("says what an empty vault needs", async () => {
    apiMock.listTasks.mockResolvedValue([]);
    apiMock.listEpics.mockResolvedValue([]);
    render(<TasksView />);
    expect(await screen.findByText("No epics yet.")).toBeInTheDocument();
  });
});
