import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";

const apiMock = vi.hoisted(() => ({
  listTasks: vi.fn(),
  listEpics: vi.fn(),
  getEpicOrder: vi.fn(() => Promise.resolve([])),
  epicCreate: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));

import { TasksPanel } from "./TasksPanel";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

describe("TasksPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    apiMock.listTasks
      .mockReset()
      .mockResolvedValue([
        makeTask({ path: "Tasks/A.md", title: "One" }),
        makeTask({ path: "Tasks/A.md", line: 6, title: "Two", done: true }),
        makeTask({ path: "Tasks/B.md", title: "Three", done: true }),
      ]);
    apiMock.listEpics.mockReset().mockResolvedValue([
      { path: "Tasks/A.md", title: "Alpha", source: null, description: "", tags: [] },
      { path: "Tasks/B.md", title: "Beta", source: null, description: "", tags: [] },
    ]);
    useTaskStore.setState({
      tasks: [],
      epics: [],
      loaded: false,
      epicPath: null,
      chosenArea: null,
    });
    useUiStore.setState({ centerView: "tasks" });
    useVaultStore.setState({ projects: [] });
  });

  it("puts the epics of a project under its name, and the others under Other epics", async () => {
    apiMock.listTasks.mockResolvedValue([
      makeTask({ path: "Office/Epics/Move.md", title: "One" }),
      makeTask({ path: "Tasks/A.md", title: "Two" }),
    ]);
    apiMock.listEpics.mockResolvedValue([
      {
        path: "Office/Epics/Move.md",
        title: "Office move",
        source: null,
        description: "",
        tags: [],
      },
      { path: "Tasks/A.md", title: "Alpha", source: null, description: "", tags: [] },
    ]);
    useVaultStore.setState({
      projects: [{ id: "p1", name: "Office move", folder: "Office" } as never],
    });
    render(<TasksPanel />);
    const office = await screen.findByRole("list", { name: "Epics of Office move" });
    expect(office).toHaveTextContent("Office move");
    expect(screen.getByText("Project · Office move")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Other epics" })).toHaveTextContent("Alpha");
  });

  it("lists the epics with how far each has come, finished ones folded away", async () => {
    render(<TasksPanel />);
    const user = userEvent.setup();
    const alpha = await screen.findByRole("button", { name: /Alpha/ });
    expect(alpha).toHaveTextContent("1 of 2");
    expect(screen.getByText("Choose an epic")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Beta/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Finished epics · 1" }));
    expect(screen.getByRole("button", { name: /Beta/ })).toBeInTheDocument();
  });

  it("chooses an epic, keeps the choice and shows the task list", async () => {
    useUiStore.setState({ centerView: "epic" });
    render(<TasksPanel />);
    await userEvent.setup().click(await screen.findByRole("button", { name: /Alpha/ }));
    expect(useTaskStore.getState().chosenArea).toBe("Tasks/A.md");
    expect(useUiStore.getState().centerView).toBe("tasks");
  });

  it("has a row for the loose tasks of pages that are not epics", async () => {
    apiMock.listTasks.mockResolvedValue([
      makeTask({ path: "Tasks/A.md", title: "One" }),
      makeTask({ path: "Møder/Acme.md", title: "Loose one" }),
      makeTask({ path: "Møder/Acme.md", line: 8, title: "Loose two" }),
    ]);
    render(<TasksPanel />);
    const row = await screen.findByRole("button", { name: /Loose tasks/ });
    expect(row).toHaveTextContent("2");
    await userEvent.setup().click(row);
    expect(useTaskStore.getState().chosenArea).toBe("__loose__");
  });

  it("makes a new epic from the button at the top, and shows it", async () => {
    apiMock.epicCreate.mockResolvedValue({
      path: "Tasks/New one.md",
      title: "New one",
      source: null,
      description: "",
      tags: [],
    });
    useUiStore.setState({ centerView: "time" });
    render(<TasksPanel />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "New epic" }));
    await user.type(screen.getByLabelText("Name"), "New one{Enter}");
    expect(apiMock.epicCreate).toHaveBeenCalledWith("New one");
    await waitFor(() => {
      expect(useTaskStore.getState().chosenArea).toBe("Tasks/New one.md");
    });
    expect(useUiStore.getState().centerView).toBe("tasks");
  });

  it("has no filters and no box for writing a task", async () => {
    render(<TasksPanel />);
    await screen.findByRole("button", { name: /Alpha/ });
    expect(screen.queryByLabelText("Add a task here")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /All open|Moved from earlier|This week/ }),
    ).toBeNull();
  });
});

describe("TasksPanel tag filter", () => {
  beforeEach(() => {
    localStorage.clear();
    useTaskStore.setState({
      tasks: [
        makeTask({ path: "Tasks/A.md", title: "One", key: "a" }),
        makeTask({ path: "Tasks/B.md", title: "Two", key: "b", tags: ["intern"] }),
      ],
      epics: [
        { path: "Tasks/A.md", title: "Alpha", source: null, description: "", tags: ["kunde-x"] },
        { path: "Tasks/B.md", title: "Beta", source: null, description: "", tags: [] },
      ],
      loaded: true,
      chosenArea: null,
      tagFilter: null,
      load: vi.fn().mockResolvedValue(undefined),
    });
    useUiStore.setState({ centerView: "tasks" });
  });

  it("lists the tags of the epics and tasks, and a tag narrows the areas to what has it", async () => {
    render(<TasksPanel />);
    const user = userEvent.setup();
    const tags = screen.getByRole("list", { name: "Show only a tag" });
    expect(tags).toHaveTextContent("#kunde-x");
    expect(tags).toHaveTextContent("#intern");
    await user.click(screen.getByRole("button", { name: "#kunde-x" }));
    expect(screen.getByRole("button", { name: /Alpha/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Beta/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: "#intern" }));
    expect(screen.getByRole("button", { name: /Beta/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Alpha/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: "#intern" }));
    expect(screen.getByRole("button", { name: /Alpha/ })).toBeInTheDocument();
  });
});
