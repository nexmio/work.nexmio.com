import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";

const apiMock = vi.hoisted(() => ({
  taggedNotes: vi.fn(),
  readNote: vi.fn(),
  writeNote: vi.fn(),
  noteSetTag: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));
vi.mock("@/lib/useAiBlocked", () => ({ useAiBlocked: () => null }));
vi.mock("@/lib/wake", () => ({ wakeIfNeeded: () => new Promise(() => undefined) }));

import { LinkResolver } from "@/lib/links";
import { parsePlan } from "@/lib/planTree";
import { PartSlot } from "./PartSlot";
import { PlansView } from "./PlansView";
import { usePlanStore } from "@/stores/planStore";
import { useAiJobStore } from "@/stores/aiJobStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

const PATH = "Plans/Move.md";
const NOTE = `---
tags: [plan]
---
# Move the office

- Find the place [[Tasks/Find the place]]
  - Visit the offices
  - Ask Mette
- Network [[Network plan]]
- Moving day
  - Book the van
  - Tell the staff
`;

const epics = [
  {
    path: "Tasks/Find the place.md",
    title: "Find the place",
    source: null,
    description: "",
    tags: [],
  },
];
const tasks = [
  makeTask({ path: "Tasks/Find the place.md", line: 3, title: "Visit the offices", done: true }),
  makeTask({ path: "Tasks/Find the place.md", line: 4, title: "Ask Mette" }),
];

describe("PlansView", () => {
  const epicFor = vi.fn();
  const addToNote = vi.fn();
  const createEpic = vi.fn();
  const open = vi.fn();
  const openEpic = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    apiMock.writeNote.mockResolvedValue(undefined);
    apiMock.noteSetTag.mockResolvedValue([]);
    apiMock.taggedNotes.mockResolvedValue([{ path: PATH, content: NOTE }]);
    apiMock.readNote.mockImplementation(() => Promise.resolve({ path: PATH, content: NOTE }));
    epicFor.mockResolvedValue("Tasks/Move the office.md");
    addToNote.mockResolvedValue(undefined);
    createEpic.mockResolvedValue("Tasks/Find the place 2.md");
    useTaskStore.setState({
      tasks,
      epics,
      epicOrder: [],
      loaded: true,
      load: vi.fn().mockResolvedValue(undefined),
      epicFor,
      addToNote,
      createEpic,
      open,
      openEpic,
    });
    useVaultStore.setState({
      projects: [],
      files: [PATH, "Tasks/Find the place.md", "Notes/Network plan.md", "Notes/Other.md"],
      resolver: new LinkResolver([PATH, "Tasks/Find the place.md", "Notes/Network plan.md"]),
      openNote: vi.fn().mockResolvedValue(undefined),
      refreshTree: vi.fn().mockResolvedValue(undefined),
    });
    useUiStore.setState({ centerView: "plans" });
    usePlanStore.setState({
      plans: [],
      path: PATH,
      title: "Move the office",
      finished: false,
      nodes: parsePlan(NOTE).nodes,
      view: "outline",
      selected: null,
      dialog: null,
      guidedOpen: false,
      adding: null,
    });
    localStorage.clear();
  });

  it("asks you to choose or make a plan when none is open", async () => {
    usePlanStore.setState({ path: null, nodes: [] });
    render(<PlansView />);
    expect(screen.getByText("Start a project")).toBeInTheDocument();
    expect(screen.getByText("New project", { selector: "b" })).toBeInTheDocument();
    expect(screen.getByText("This is what a plan looks like:")).toBeInTheDocument();
    // Plans are out of beta: no Beta badge.
    expect(screen.queryByText("Beta")).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: "New project" }));
    expect(usePlanStore.getState().guidedOpen).toBe(true);
  });

  it("shows the ideas as an outline, with what each is tied to and a place to start", async () => {
    render(<PlansView />);
    expect(screen.getByText("Find the place")).toBeInTheDocument();
    // The epic shows how far it has come, the note it links to is a chip, and the epic opens.
    const epic = screen.getByRole("button", { name: "Epic · 1 of 2" });
    await userEvent.setup().click(epic);
    expect(openEpic).toHaveBeenCalledWith("Tasks/Find the place.md");
    expect(screen.getByRole("button", { name: "Page" })).toBeInTheDocument();
    // The smallest place to start is the first open task under an epic of the plan.
    const card = screen.getByText("A small place to start").parentElement as HTMLElement;
    expect(card).toHaveTextContent("Ask Mette");
    await userEvent.setup().click(screen.getByRole("button", { name: "Open the task" }));
    expect(open).toHaveBeenCalled();
  });

  it("folds a branch", async () => {
    render(<PlansView />);
    const user = userEvent.setup();
    expect(screen.getByText("Book the van")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fold Moving day" }));
    expect(screen.queryByText("Book the van")).toBeNull();
  });

  it("adds a part at the end, and writes it in the page without touching the rest", async () => {
    render(<PlansView />);
    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "+ Add a part" }),
      "Order a new sign{Enter}",
    );
    await waitFor(() => {
      expect(apiMock.writeNote).toHaveBeenCalled();
    });
    const [where, text] = apiMock.writeNote.mock.calls[0] as [string, string];
    expect(where).toBe(PATH);
    expect(text).toContain("tags: [plan]");
    expect(text.trimEnd().endsWith("- Order a new sign")).toBe(true);
  });

  it("writes a tree down with Enter, Tab and Shift+Tab, and takes a pasted indented list", async () => {
    const written: Record<string, string> = {};
    apiMock.writeNote.mockImplementation((p: string, c: string) => {
      written[p] = c;
      return Promise.resolve(undefined);
    });
    apiMock.readNote.mockImplementation((p: string) =>
      Promise.resolve({ path: p, content: written[p] ?? NOTE }),
    );
    render(<PlansView />);
    const user = userEvent.setup();
    const field = screen.getByRole("textbox", { name: "+ Add a part" });
    await user.type(field, "Alpha{Enter}{Tab}Beta{Enter}{Shift>}{Tab}{/Shift}Gamma{Enter}");
    await waitFor(() => {
      expect(written[PATH]).toContain("- Alpha\n  - Beta\n- Gamma");
    });
    await user.click(field);
    await user.paste("One\n  Two\n  Three\nFour");
    await waitFor(() => {
      expect(written[PATH]).toContain("- One\n  - Two\n  - Three\n- Four");
    });
  });

  it("keeps the epic of a plan in a project in the project's Epics folder", async () => {
    useVaultStore.setState({ projects: [{ id: "p1", name: "Plans", folder: "Plans" } as never] });
    render(<PlansView />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "More for Network" }));
    await user.click(await screen.findByRole("menuitem", { name: "Link or make a task…" }));
    await user.click(await screen.findByRole("button", { name: "Make a new task" }));
    await waitFor(() => {
      expect(epicFor).toHaveBeenCalledWith(PATH, "Plans/Epics");
    });
  });

  it("makes a task of an idea in the epic made for the plan", async () => {
    render(<PlansView />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "More for Network" }));
    await user.click(await screen.findByRole("menuitem", { name: "Link or make a task…" }));
    await user.click(await screen.findByRole("button", { name: "Make a new task" }));
    await waitFor(() => {
      expect(addToNote).toHaveBeenCalledWith("Tasks/Move the office.md", [
        "Network #move-the-office",
      ]);
    });
    expect(epicFor).toHaveBeenCalledWith(PATH);
    // The plan's epic gets the plan's tag too.
    expect(apiMock.noteSetTag).toHaveBeenCalledWith(
      "Tasks/Move the office.md",
      "move-the-office",
      true,
    );
  });

  it("links a page to an idea", async () => {
    render(<PlansView />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "More for Moving day" }));
    await user.click(await screen.findByRole("menuitem", { name: "Link or make a page…" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByRole("textbox", { name: "Search for a page" }), "other");
    await user.click(within(dialog).getByRole("button", { name: /Other/ }));
    await waitFor(() => {
      expect(apiMock.writeNote).toHaveBeenCalled();
    });
    expect(apiMock.writeNote.mock.calls[0]?.[1]).toContain("- Moving day [[Notes/Other]]");
  });

  it("asks the AI for parts in the queue, without a window that waits", async () => {
    useAiJobStore.setState({ jobs: [] });
    render(<PlansView />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "More for Network" }));
    await user.click(await screen.findByRole("menuitem", { name: "Break it down…" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    const job = useAiJobStore.getState().jobs[0];
    expect(job).toMatchObject({ kind: "pick", label: "Break it down: Network" });
    // The queue is shown by itself, in the AI box.
    expect(useUiStore.getState().askOpen).toBe(true);
    useAiJobStore.setState({ jobs: [] });
  });

  it("repeats the steps of a branch for several names: one epic, a task for each, the steps as its steps", async () => {
    const addStep = vi.fn().mockResolvedValue(undefined);
    const names = ["Copenhagen", "Aarhus"].map((title) => ({
      ...tasks[0],
      path: "Tasks/Move the office.md",
      title,
    })) as typeof tasks;
    useTaskStore.setState({ addStep, tasks: [...tasks, ...names] });
    render(<PlansView />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "More for Moving day" }));
    await user.click(await screen.findByRole("menuitem", { name: "Repeat these steps for…" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByRole("textbox", { name: "Names" }),
      "Copenhagen{Enter}Aarhus",
    );
    // The drawing shows what will be made, with the names written.
    const drawing = within(dialog).getByRole("figure", { name: "What Repeat does" });
    expect(drawing).toHaveTextContent("Copenhagen");
    expect(drawing).toHaveTextContent("stays as the heading");
    await user.click(within(dialog).getByRole("button", { name: "Make 2 tasks" }));
    await waitFor(() => {
      expect(apiMock.writeNote).toHaveBeenCalled();
    });
    expect(createEpic).not.toHaveBeenCalled();
    expect(addToNote).toHaveBeenCalledWith("Tasks/Move the office.md", [
      "Copenhagen #move-the-office",
      "Aarhus #move-the-office",
    ]);
    expect(addStep).toHaveBeenCalledTimes(4);
    const text = apiMock.writeNote.mock.calls[0]?.[1] as string;
    // Moving day stays as the heading; the names are under it with the steps, which moved in.
    expect(text).toContain(
      "- Moving day\n  - Copenhagen [[Tasks/Move the office#Copenhagen]]\n    - Book the van\n    - Tell the staff\n  - Aarhus [[Tasks/Move the office#Aarhus]]\n    - Book the van\n    - Tell the staff\n",
    );
  });

  it("finishes a plan and carries the open ideas over to a new one, which keeps a line about it", async () => {
    apiMock.taggedNotes.mockResolvedValue([]);
    const written: Record<string, string> = {};
    apiMock.writeNote.mockImplementation((p: string, c: string) => {
      written[p] = c;
      return Promise.resolve(undefined);
    });
    apiMock.readNote.mockImplementation((p: string) =>
      Promise.resolve({ path: p, content: written[p] ?? NOTE }),
    );
    render(<PlansView />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "More for this plan" }));
    await user.click(await screen.findByRole("menuitem", { name: "Archive plan…" }));
    const dialog = await screen.findByRole("dialog");
    // The idea whose epic is not finished and the ideas without one are offered; unticking one keeps it here.
    await user.click(within(dialog).getByRole("checkbox", { name: "Network" }));
    await user.click(within(dialog).getByRole("button", { name: "Archive and carry over" }));
    await waitFor(() => {
      expect(apiMock.noteSetTag).toHaveBeenCalledWith(PATH, "plan-finished", true);
    });
    const next = written["Plans/Move the office (continued).md"] ?? "";
    expect(next).toContain("- Find the place [[Tasks/Find the place]]");
    expect(next).toContain("- Moving day");
    expect(next).not.toContain("- Network");
    const old = written[PATH] ?? "";
    expect(old).toContain("- Network [[Network plan]]");
    expect(old).toContain("- Moved to [[Plans/Move the office (continued)]]");
    expect(old).not.toContain("- Moving day");
  });

  it("shows the same parts as a map, and the chosen box in the right panel", async () => {
    usePlanStore.setState({ view: "map" });
    render(
      <>
        <PartSlot />
        <PlansView />
      </>,
    );
    const user = userEvent.setup();
    // Nothing is chosen: the panel says how the map is used.
    expect(await screen.findByText(/Choose a box to see what you can do/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Network" }));
    expect(useUiStore.getState().rightTab).toBe("part");
    expect(useUiStore.getState().rightCollapsed).toBe(false);
    const panel = screen.getByTestId("part-slot");
    expect(panel).toHaveTextContent("Network");
    // The actions are in four groups, and the long labels stay as names of the buttons.
    for (const g of ["Parts", "Link to", "Move"]) {
      expect(within(panel).getByRole("region", { name: g })).toBeInTheDocument();
    }
    await user.click(within(panel).getByRole("button", { name: "Link or make a task…" }));
    expect(usePlanStore.getState().dialog?.kind).toBe("linktask");
    usePlanStore.getState().setDialog(null);
    // "Add a part" opens the window on the map (the outline's own field is not there).
    await user.click(await within(panel).findByRole("button", { name: "Add a part" }));
    expect(usePlanStore.getState().dialog).toEqual({ kind: "add", path: [1] });
    usePlanStore.getState().setDialog(null);
  });

  it("adds parts in the window with Add or Enter, and closes with Close", async () => {
    usePlanStore.setState({ view: "map", dialog: { kind: "add", path: [2] } });
    const written: string[] = [];
    apiMock.writeNote.mockImplementation((_p: string, text: string) => {
      written.push(text);
      return Promise.resolve();
    });
    render(<PlansView />);
    const user = userEvent.setup();
    const add = await screen.findByRole("button", { name: "Add" });
    expect(add).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "A new part" }), "Pack the boxes");
    await user.click(add);
    await waitFor(() => {
      expect(written.join("")).toContain("- Pack the boxes");
    });
    // The window's own button (the X in the corner is called Close too).
    const close = await screen.findAllByRole("button", { name: "Close" });
    const footer = close.find((b) => b.textContent === "Close");
    expect(footer).toBeDefined();
    if (footer) await user.click(footer);
    expect(usePlanStore.getState().dialog).toBeNull();
  });

  it("writes a short note on a part in the right panel, kept in the plan's page", async () => {
    usePlanStore.setState({ view: "map", selected: [1] });
    const written: string[] = [];
    apiMock.writeNote.mockImplementation((_p: string, text: string) => {
      written.push(text);
      return Promise.resolve();
    });
    render(
      <>
        <PartSlot />
        <PlansView />
      </>,
    );
    const user = userEvent.setup();
    const panel = await screen.findByTestId("part-slot");
    await user.click(await within(panel).findByRole("button", { name: /Write a note/ }));
    await user.type(
      within(panel).getByRole("textbox", { name: "Note about this part" }),
      "Only the office, not home",
    );
    await user.click(within(panel).getByRole("button", { name: "Save the note" }));
    await waitFor(() => {
      expect(written.join("")).toContain(
        "- Network [[Network plan]]\n  > Only the office, not home\n",
      );
    });
  });

  it("renames the chosen part in the right panel, not on the map", async () => {
    usePlanStore.setState({ view: "map", selected: [1] });
    const written: string[] = [];
    apiMock.writeNote.mockImplementation((_p: string, text: string) => {
      written.push(text);
      return Promise.resolve();
    });
    render(
      <>
        <PartSlot />
        <PlansView />
      </>,
    );
    const user = userEvent.setup();
    const panel = await screen.findByTestId("part-slot");
    await user.click(await within(panel).findByRole("button", { name: /Rename/ }));
    const box = within(panel).getByRole("textbox", { name: "Words of Network" });
    await user.clear(box);
    await user.type(box, "Network and Wi-Fi{Enter}");
    await waitFor(() => {
      expect(written.join("")).toContain("- Network and Wi-Fi");
    });
  });

  it("moves a part up and down and in and out from the right panel", async () => {
    usePlanStore.setState({ view: "map", selected: [2] });
    const written: string[] = [];
    apiMock.writeNote.mockImplementation((_p: string, text: string) => {
      written.push(text);
      return Promise.resolve();
    });
    render(
      <>
        <PartSlot />
        <PlansView />
      </>,
    );
    const user = userEvent.setup();
    const panel = await screen.findByTestId("part-slot");
    // The moves say in words what they do; what cannot be done here is greyed out.
    expect(within(panel).getByRole("button", { name: /Later/ })).toBeDisabled();
    expect(within(panel).getByRole("button", { name: /One level up/ })).toBeDisabled();
    expect(within(panel).getByRole("button", { name: /Under the one before/ })).toBeEnabled();
    expect(within(panel).getByText(/makes it a smaller part of the part just/)).toBeInTheDocument();
    await user.click(await within(panel).findByRole("button", { name: /Earlier/ }));
    await waitFor(() => {
      expect(written.length).toBeGreaterThan(0);
    });
    expect(written[0]).toMatch(/- Moving day[\s\S]*- Network/);
  });

  it("keeps the steps when one of them is tied to something, and puts the names after them", async () => {
    const NOTE2 = NOTE.replace("  - Book the van", "  - Book the van [[Notes/Other]]");
    apiMock.readNote.mockImplementation(() => Promise.resolve({ path: PATH, content: NOTE2 }));
    usePlanStore.setState({ nodes: parsePlan(NOTE2).nodes, dialog: { kind: "repeat", path: [2] } });
    epicFor.mockResolvedValue(null);
    render(<PlansView />);
    const user = userEvent.setup();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("figure")).toHaveTextContent("with its steps");
    await user.type(within(dialog).getByRole("textbox", { name: "Names" }), "Aarhus");
    await user.click(within(dialog).getByRole("button", { name: "Make 1 task" }));
    await waitFor(() => {
      expect(apiMock.writeNote).toHaveBeenCalled();
    });
    expect(apiMock.writeNote.mock.calls[0]?.[1]).toContain(
      "- Moving day\n  - Book the van [[Notes/Other]]\n  - Tell the staff\n  - Aarhus\n    - Book the van\n",
    );
  });

  it("has no way to make or link an epic on a part: the plan has its own epic", async () => {
    usePlanStore.setState({ view: "map", selected: [1] });
    render(
      <>
        <PartSlot />
        <PlansView />
      </>,
    );
    const user = userEvent.setup();
    const panel = await screen.findByTestId("part-slot");
    const links = await within(panel).findByRole("region", { name: "Link to" });
    expect(within(links).queryByRole("button", { name: /epic/i })).toBeNull();
    expect(within(links).getByRole("button", { name: "Link or make a page…" })).toBeInTheDocument();
    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByRole("button", { name: /^Network/ }),
    });
    await screen.findByRole("menuitem", { name: "Rename" });
    expect(screen.queryByRole("menuitem", { name: /epic/i })).toBeNull();
  });

  it("right-click Write a note on the map opens the note in the right panel", async () => {
    usePlanStore.setState({ view: "map", noteAt: null });
    render(
      <>
        <PartSlot />
        <PlansView />
      </>,
    );
    const user = userEvent.setup();
    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByRole("button", { name: /^Network/ }),
    });
    await user.click(await screen.findByRole("menuitem", { name: "Write a note…" }));
    expect(useUiStore.getState().rightTab).toBe("part");
    const panel = await screen.findByTestId("part-slot");
    const box = await within(panel).findByRole("textbox", { name: "Note about this part" });
    await waitFor(() => {
      expect(box).toHaveFocus();
    });
    // Rename, not "Change the words", in the menu.
    await user.keyboard("{Escape}");
    await user.pointer({
      keys: "[MouseRight]",
      target: screen.getByRole("button", { name: /^Network/ }),
    });
    expect(await screen.findByRole("menuitem", { name: "Rename" })).toBeInTheDocument();
  });

  it("arranges the parts of a chosen box from the right panel", async () => {
    usePlanStore.setState({ view: "map", selected: [0] });
    render(
      <>
        <PartSlot />
        <PlansView />
      </>,
    );
    const panel = await screen.findByTestId("part-slot");
    const arrange = await within(panel).findByRole("region", { name: "Arrange the parts" });
    await userEvent.setup().click(within(arrange).getByRole("button", { name: /Stacked/ }));
    expect(within(arrange).getByRole("button", { name: /Stacked/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(localStorage.getItem("nexmio.planMap")).toContain("cols");
  });

  it("the plan itself, when chosen, has only Parts, with no Move, Link to or Delete", async () => {
    usePlanStore.setState({ view: "map", selected: [] });
    render(
      <>
        <PartSlot />
        <PlansView />
      </>,
    );
    const panel = await screen.findByTestId("part-slot");
    await within(panel).findByRole("region", { name: "Parts" });
    expect(within(panel).queryByRole("region", { name: "Move" })).toBeNull();
    expect(within(panel).queryByRole("region", { name: "Link to" })).toBeNull();
    expect(within(panel).queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("starts the map with the plan as a box, takes a right-click, and changes the words of a box", async () => {
    usePlanStore.setState({ view: "map" });
    render(<PlansView />);
    const user = userEvent.setup();
    await user.dblClick(screen.getByRole("button", { name: /^Network/ }));
    expect(screen.getByRole("textbox", { name: "Words of Network" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    const root = screen.getAllByRole("button", { name: "Move the office" })[0];
    expect(root).toBeDefined();
    if (!root) return;
    await user.pointer({ keys: "[MouseRight]", target: root });
    await user.click(await screen.findByRole("menuitem", { name: "Add a part" }));
    expect(usePlanStore.getState().dialog).toEqual({ kind: "add", path: [] });
    usePlanStore.getState().setDialog(null);
  });

  it("deletes an archived plan: only the plan's page, unless more is ticked", async () => {
    const deletePath = vi.fn().mockResolvedValue(true);
    useVaultStore.setState({ deletePath });
    usePlanStore.setState({ finished: true });
    render(<PlansView />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "More for this plan" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete plan…" }));
    const dialog = await screen.findByRole("dialog");
    // The linked page is offered, not ticked.
    const page = within(dialog).getByRole("checkbox", { name: /Network plan/ });
    expect(page).not.toBeChecked();
    await user.click(within(dialog).getByRole("button", { name: "Delete the plan" }));
    await waitFor(() => {
      expect(usePlanStore.getState().path).toBeNull();
    });
    expect(deletePath.mock.calls.map((c: unknown[]) => c[0])).toEqual([PATH]);
  });

  it("deletes what is ticked along with the plan", async () => {
    const deletePath = vi.fn().mockResolvedValue(true);
    useVaultStore.setState({ deletePath });
    usePlanStore.setState({ finished: true, dialog: { kind: "delete" } });
    render(<PlansView />);
    const user = userEvent.setup();
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("checkbox", { name: /Network plan/ }));
    await user.click(within(dialog).getByRole("button", { name: "Delete the plan and 1 more" }));
    await waitFor(() => {
      expect(deletePath).toHaveBeenCalledTimes(2);
    });
    expect(deletePath.mock.calls[1]?.[0]).toBe("Notes/Network plan.md");
  });

  it("has an Overview of the project next to the map and the outline", async () => {
    render(<PlansView />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Overview" }));
    expect(usePlanStore.getState().view).toBe("overview");
    expect(await screen.findByRole("region", { name: "How far" })).toBeInTheDocument();
    for (const box of ["Meetings", "Decisions", "Waiting for others", "Newest pages"]) {
      expect(screen.getByRole("region", { name: box })).toBeInTheDocument();
    }
  });

  it("switches between the outline and the map, and can be finished and opened again", async () => {
    render(<PlansView />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Map" }));
    expect(usePlanStore.getState().view).toBe("map");
    usePlanStore.setState({ finished: true });
    await user.click(await screen.findByRole("button", { name: "More for this plan" }));
    expect(await screen.findByRole("menuitem", { name: "Open it again" })).toBeInTheDocument();
    expect(screen.getByText(/This plan is archived/)).toBeInTheDocument();
  });
});
