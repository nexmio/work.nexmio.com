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
import { ALL_AREA, LOOSE_AREA } from "@/lib/taskLogic";
import { LinkResolver } from "@/lib/links";
import { usePlanIndex } from "@/stores/planIndexStore";

describe("TasksView: every epic in rows, and one epic with status dots", () => {
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
      chosenArea: "Tasks/VPN guide.md",
      // The area belongs to the open vault (none here), so it is kept when the list opens.
      areaVault: "",
      looking: null,
    });
    useUiStore.setState({ centerView: "tasks", rightTab: "outline" });
    useTimerStore.setState({ running: null });
    useVaultStore.setState({ activePath: null });
  });

  const next = () => screen.findByRole("region", { name: "Next" });

  it("opens on every epic in rows, with what you work on, what is next and what waits", async () => {
    useTaskStore.setState({ areaVault: undefined });
    apiMock.listTasks.mockResolvedValue([
      makeTask({
        path: "Tasks/VPN guide.md",
        line: 3,
        key: "a",
        title: "Write the steps",
        status: "doing",
      }),
      makeTask({ path: "Tasks/VPN guide.md", line: 4, key: "b", title: "Test on Linux" }),
      makeTask({
        path: "Tasks/VPN guide.md",
        line: 5,
        key: "c",
        title: "Ask the vendor",
        status: "waiting",
        waitingFor: "the vendor",
        history: [{ date: "2026-10-21", text: "Status: waiting" }],
      }),
      makeTask({ path: "Tasks/Done one.md", line: 2, title: "Order headsets", done: true }),
      makeTask({ path: "Møder/Acme.md", line: 5, title: "Renew the licence" }),
    ]);
    render(<TasksView />);
    const table = await screen.findByRole("table", { name: "All epics" });
    expect(useTaskStore.getState().chosenArea).toBe(ALL_AREA);
    expect(screen.getByRole("heading", { name: "All epics" })).toBeInTheDocument();
    const vpn = within(table).getByRole("row", { name: "VPN guide" });
    expect(
      within(within(vpn).getByRole("cell", { name: "Working on" })).getByText("Write the steps"),
    ).toBeInTheDocument();
    expect(
      within(within(vpn).getByRole("cell", { name: "Next" })).getByText("Test on Linux"),
    ).toBeInTheDocument();
    const waits = within(vpn).getByRole("cell", { name: "Waiting" });
    expect(within(waits).getByText("the vendor · 4 days")).toBeInTheDocument();
    // A finished epic has no row; the loose tasks have one of their own.
    expect(within(table).queryByRole("row", { name: "Office move" })).toBeNull();
    expect(within(table).getByRole("row", { name: "Loose tasks" })).toHaveTextContent(
      "Renew the licence",
    );
    await userEvent.setup().click(within(vpn).getByRole("button", { name: "VPN guide" }));
    expect(useTaskStore.getState().chosenArea).toBe("Tasks/VPN guide.md");
    expect(await next()).toHaveTextContent("Test on Linux");
  });

  it("shows only the chosen epic in groups, with its progress, and marks no task for you", async () => {
    render(<TasksView />);
    const list = await next();
    expect(within(list).getByText("Write the steps")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "VPN guide" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText("1 of 4")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Working on" })).toBeNull();
    const waiting = screen.getByRole("region", { name: "Waiting" });
    expect(within(waiting).getByText("Ask the vendor")).toBeInTheDocument();
    expect(within(waiting).getByText("the vendor")).toBeInTheDocument();
    // Nothing of the other areas, and no bar or button to work on a task.
    expect(screen.queryByText("Order headsets")).toBeNull();
    expect(screen.queryByText("Renew the licence")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Work on/ })).toBeNull();
  });

  it("says which plan an epic made for a plan belongs to, and opens it", async () => {
    apiMock.listEpics.mockResolvedValue([
      { path: "Tasks/VPN guide.md", title: "VPN guide", source: "Plans/VPN" },
    ]);
    useVaultStore.setState({ resolver: new LinkResolver(["Plans/VPN.md", "Tasks/VPN guide.md"]) });
    usePlanIndex.setState({ paths: ["Plans/VPN.md"], loaded: true });
    render(<TasksView />);
    expect(await screen.findByText(/Part of the plan/)).toHaveTextContent("“VPN”");
    await userEvent.setup().click(screen.getByRole("button", { name: "Open the plan" }));
    expect(useUiStore.getState().planToOpen).toBe("Plans/VPN.md");
    expect(useUiStore.getState().centerView).toBe("plans");
    usePlanIndex.setState({ paths: [], loaded: true });
  });

  it("shows no plan line for an epic that came from an ordinary page", async () => {
    useVaultStore.setState({
      resolver: new LinkResolver(["IT/VPN client guide.md", "Tasks/VPN guide.md"]),
    });
    usePlanIndex.setState({ paths: [], loaded: true });
    render(<TasksView />);
    await next();
    expect(screen.queryByText(/Part of the plan/)).toBeNull();
  });

  it("has no filters, no fold buttons and no Today", async () => {
    render(<TasksView />);
    await next();
    for (const gone of [/^All$/, /^Doing$/, /^Waiting$/, /Next up/, /Fold all/, /Today/]) {
      expect(screen.queryByRole("button", { name: gone })).toBeNull();
    }
  });

  it("changes a task's status from its dot, in words", async () => {
    apiMock.taskSetMeta.mockImplementation(() => Promise.resolve(useTaskStore.getState().tasks));
    render(<TasksView />);
    const user = userEvent.setup();
    const list = await next();
    await user.click(
      within(list).getByRole("button", { name: "To do: Test on Linux. Change the status" }),
    );
    for (const word of ["To do", "Working on", "Waiting", "Done"]) {
      expect(screen.getByRole("menuitem", { name: new RegExp(word) })).toBeInTheDocument();
    }
    await user.click(screen.getByRole("menuitem", { name: /Working on/ }));
    await waitFor(() => {
      expect(apiMock.taskSetMeta).toHaveBeenCalledWith("Tasks/VPN guide.md", 6, "k6", {
        status: "doing",
        waitingFor: null,
        after: null,
      });
    });
  });

  it("ticks a task done from its dot", async () => {
    apiMock.taskSetDone.mockResolvedValue([]);
    render(<TasksView />);
    const user = userEvent.setup();
    const list = await next();
    await user.click(
      within(list).getByRole("button", { name: "To do: Test on Linux. Change the status" }),
    );
    await user.click(screen.getByRole("menuitem", { name: /Done/ }));
    await waitFor(() => {
      expect(apiMock.taskSetDone).toHaveBeenCalledWith("Tasks/VPN guide.md", 6, "k6", true);
    });
  });

  it("opens a task in the quick look, goes to the next one with the arrow keys and closes with Esc", async () => {
    render(<TasksView />);
    const user = userEvent.setup();
    const list = await next();
    await user.click(within(list).getByRole("button", { name: "Write the steps" }));
    const look = await screen.findByRole("dialog");
    expect(
      within(look).getByRole("heading", { level: 3, name: "Write the steps" }),
    ).toBeInTheDocument();
    expect(within(look).getByText("1 of 3")).toBeInTheDocument();
    // The right panel is not used for it.
    expect(useUiStore.getState().rightTab).toBe("outline");
    await user.keyboard("{ArrowDown}");
    expect(
      within(look).getByRole("heading", { level: 3, name: "Test on Linux" }),
    ).toBeInTheDocument();
    await user.click(within(look).getByRole("button", { name: "Next" }));
    expect(
      within(look).getByRole("heading", { level: 3, name: "Ask the vendor" }),
    ).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(useTaskStore.getState().looking).toBeNull();
  });

  it("starts a timer from the quick look", async () => {
    const start = vi.fn().mockResolvedValue(undefined);
    useTimerStore.setState({ start, running: null });
    render(<TasksView />);
    const user = userEvent.setup();
    await user.click(within(await next()).getByRole("button", { name: "Write the steps" }));
    await user.click(await screen.findByRole("button", { name: /Start timer/ }));
    expect(start.mock.calls[0]?.[0]).toMatchObject({ title: "Write the steps" });
  });

  it("folds the done tasks away and opens them", async () => {
    render(<TasksView />);
    const user = userEvent.setup();
    await next();
    expect(screen.queryByText("Test on a Mac")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Done · 1" }));
    expect(screen.getByText("Test on a Mac")).toBeInTheDocument();
    // A done task is dimmed, never struck through.
    expect(screen.getByText("Test on a Mac").className).not.toContain("line-through");
  });

  it("shows the loose tasks of ordinary pages apart, and makes a page an epic", async () => {
    apiMock.epicAdopt.mockResolvedValue({ path: "Møder/Acme.md", title: "Acme", source: null });
    apiMock.taskSetDone.mockResolvedValue([
      makeTask({ path: "Møder/Acme.md", line: 5, title: "Renew the licence", done: true }),
    ]);
    useTaskStore.setState({ chosenArea: LOOSE_AREA });
    render(<TasksView />);
    const user = userEvent.setup();
    expect(await screen.findByRole("heading", { name: "Loose tasks" })).toBeInTheDocument();
    const acme = screen.getByRole("region", { name: "Acme" });
    await user.click(
      within(acme).getByRole("button", { name: "To do: Renew the licence. Change the status" }),
    );
    await user.click(screen.getByRole("menuitem", { name: /Done/ }));
    await waitFor(() => {
      expect(apiMock.taskSetDone).toHaveBeenCalledWith("Møder/Acme.md", 5, "key-1", true);
    });
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
    await user.click(await screen.findByRole("button", { name: "More for this epic" }));
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
    await next();
    expect(screen.queryByRole("textbox", { name: /^Name/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: "More for this epic" }));
    await user.click(await screen.findByRole("menuitem", { name: "Rename this epic…" }));
    const field = screen.getByLabelText("Name");
    await user.clear(field);
    await user.type(field, "VPN{Enter}");
    expect(apiMock.epicSetTitle).toHaveBeenCalledWith("Tasks/VPN guide.md", "VPN");

    await user.click(screen.getByRole("button", { name: "More for this epic" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete this epic…" }));
    expect(apiMock.deletePath).not.toHaveBeenCalled();
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(apiMock.deletePath).toHaveBeenCalledWith("Tasks/VPN guide.md");
    });
  });

  it("moves the epic up and down among the epics", async () => {
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
    await next();
    await user.click(screen.getByRole("button", { name: "More for this epic" }));
    await user.click(await screen.findByRole("menuitem", { name: "Move this epic up" }));
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
    const after = await next();
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
