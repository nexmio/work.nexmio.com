import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  taggedNotes: vi.fn(),
  noteSetTag: vi.fn(() => Promise.resolve([])),
  readNote: vi.fn(),
  listIdeas: vi.fn(() => Promise.resolve([])),
  listTasks: vi.fn(() => Promise.resolve([])),
  listEpics: vi.fn(() => Promise.resolve([])),
  getEpicOrder: vi.fn(() => Promise.resolve([])),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
const openFile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/actions", () => ({ openFile, newNoteInCurrentFolder: vi.fn() }));

import { StartPage } from "./StartPage";
import { useTaskStore } from "@/stores/taskStore";
import { makeTask } from "@/test/taskFixtures";
import { useMeetingStore } from "@/stores/meetingStore";
import { useUiStore } from "@/stores/uiStore";
import { useRecent } from "@/stores/recentStore";
import { useStartStore } from "@/stores/startStore";
import { DEFAULT_LAYOUT } from "@/lib/startLayout";
import { useVaultStore } from "@/stores/vaultStore";
import type { TreeNode } from "@/bindings/TreeNode";

const file = (path: string, modified: number): TreeNode => ({
  name: path,
  path,
  isDir: false,
  children: [],
  modified,
});

/** A layout a person saved before Today existed: it is kept as it is. */
const CLASSIC = [
  { id: "continue", wide: true },
  { id: "recent", wide: false },
  { id: "pinned", wide: false },
] as const;

describe("StartPage", () => {
  beforeEach(() => {
    localStorage.clear();
    useStartStore.setState({ layout: CLASSIC.map((p) => ({ ...p })), editing: false });
    openFile.mockReset();
    apiMock.taggedNotes
      .mockReset()
      .mockImplementation((tag: string) =>
        Promise.resolve(
          tag === "pinned"
            ? [{ path: "Ops/Runbook.md", mtime: 0, content: "---\ntags: [pinned]\n---\n" }]
            : [],
        ),
      );
    apiMock.readNote.mockReset().mockResolvedValue({
      path: "Work/Hiring plan.md",
      mtime: 0,
      content: "# Hiring plan\n\nWe need two engineers before Q1.\n",
    });
    useMeetingStore.setState({ meetings: [], loaded: true });
    useRecent.setState({
      paths: ["Work/Hiring plan.md", "Work/Offer.md", "Møder/Weekly.md", "Ideas.md"],
    });
    useVaultStore.setState({
      tree: [
        file("Work/Hiring plan.md", Date.now()),
        file("Work/Offer.md", Date.now()),
        file("Møder/Weekly.md", Date.now()),
        file("Ideas.md", Date.now()),
      ],
      files: [],
      reloadNonce: 0,
    });
  });

  it("continues with the last page, lists the recent ones and the pinned ones", async () => {
    render(<StartPage />);
    const user = userEvent.setup();
    expect(await screen.findByText("We need two engineers before Q1.")).toBeInTheDocument();
    expect(screen.getByText("Continue")).toBeInTheDocument();
    // The last note is the Continue card, not a row in the list; managed notes are left out.
    expect(screen.getByRole("button", { name: /Offer/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Ideas/ })).toBeNull();
    expect(await screen.findByRole("button", { name: "Runbook" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(openFile).toHaveBeenCalledWith("Work/Hiring plan.md");
  });

  it("has a brand banner band that follows the theme's mode", async () => {
    document.documentElement.classList.add("dark");
    const { unmount } = render(<StartPage />);
    expect(screen.getByTestId("start-banner").style.backgroundImage).toContain("banner-bg-dark");
    unmount();
    document.documentElement.classList.remove("dark");
    render(<StartPage />);
    expect(screen.getByTestId("start-banner").style.backgroundImage).toContain("banner-bg-light");
    await screen.findByText("We need two engineers before Q1.");
  });

  it("shows where you left off in a task, on the Continue card, when it is recent", async () => {
    const day = new Date().toISOString().slice(0, 10);
    const task = makeTask({
      title: "Upgrade the VPN gateway",
      log: [{ line: 6, date: day, text: "Left off: Take a backup first", key: "l" }],
    });
    // The page reads the list again when it opens.
    apiMock.listTasks.mockResolvedValueOnce([task] as never[]);
    useTaskStore.setState({ tasks: [task] });
    render(<StartPage />);
    const note = await screen.findByRole("note", { name: "Where you left off" });
    expect(note).toHaveTextContent("Take a backup first");
    expect(note).toHaveTextContent("Upgrade the VPN gateway");
    await userEvent.setup().click(await within(note).findByText("Open the task"));
    expect(useTaskStore.getState().selected?.title).toBe("Upgrade the VPN gateway");
    expect(useUiStore.getState().centerView).toBe("task");
  });

  it("filters the recent pages by what they are", async () => {
    apiMock.taggedNotes.mockImplementation((tag: string) =>
      Promise.resolve(
        tag === "meeting"
          ? [
              {
                path: "Møder/Weekly.md",
                mtime: 0,
                content: "---\ntags: [meeting]\n---\n# Weekly\n",
              },
            ]
          : [],
      ),
    );
    render(<StartPage />);
    const user = userEvent.setup();
    await screen.findByText("Meeting");
    await user.click(screen.getByRole("button", { name: "Meetings" }));
    expect(screen.getByRole("button", { name: /Weekly/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Offer/ })).toBeNull();
  });

  it("unpins a page", async () => {
    render(<StartPage />);
    await userEvent.setup().click(await screen.findByRole("button", { name: "Unpin Runbook" }));
    expect(apiMock.noteSetTag).toHaveBeenCalledWith("Ops/Runbook.md", "pinned", false);
  });

  it("New offers a page, a meeting, a task and an idea, and no quick page", async () => {
    render(<StartPage />);
    const user = userEvent.setup();
    const banner = screen.getByTestId("start-banner");
    await user.click(within(banner).getByRole("button", { name: /New/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Meeting" }));
    expect(useUiStore.getState().meetingFormOpen).toBe(true);
    await user.click(within(banner).getByRole("button", { name: /New/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Task" }));
    expect(useUiStore.getState().captureKind).toBe("task");
    await user.click(within(banner).getByRole("button", { name: /New/ }));
    expect(await screen.findByRole("menuitem", { name: "Idea" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Quick page" })).toBeNull();
  });

  it("welcomes a new vault with Get started and two buttons instead of empty lists", async () => {
    useRecent.setState({ paths: [] });
    apiMock.taggedNotes.mockResolvedValue([]);
    render(<StartPage />);
    expect(await screen.findByText("Welcome to Nexmio Work")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open a folder" })).toBeInTheDocument();
    // A meeting is one of the steps of Get started, so it has no button of its own here.
    expect(await screen.findByRole("region", { name: "Get started" })).toBeInTheDocument();
  });

  it("is rearranged with Customize: add, move, widen, remove and reset, and it is remembered", async () => {
    render(<StartPage />);
    const user = userEvent.setup();
    await screen.findByRole("region", { name: "Pinned" });
    // Nothing to change until Customize is pressed.
    expect(screen.queryByRole("button", { name: "Remove Pinned" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /Customize/ }));

    await user.click(screen.getByRole("button", { name: /Add widget/ }));
    await user.click(await screen.findByRole("button", { name: "Add Areas" }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(await screen.findByRole("region", { name: "Areas" })).toBeInTheDocument();
    expect(useStartStore.getState().layout.map((p) => p.id)).toEqual([
      "continue",
      "recent",
      "pinned",
      "areas",
    ]);
    expect(JSON.parse(localStorage.getItem("nexmio.startLayout") ?? "[]")).toHaveLength(4);

    // While arranging, the arrows are always shown, not only under the mouse.
    expect(screen.getByRole("button", { name: "Move Areas up" }).parentElement).toHaveClass(
      "opacity-100",
    );
    await user.click(screen.getByRole("button", { name: "Move Areas up" }));
    expect(useStartStore.getState().layout.map((p) => p.id)[2]).toBe("areas");
    const width = screen.getByRole("group", { name: "Width of Areas" });
    await user.click(within(width).getByRole("button", { name: "Full" }));
    expect(useStartStore.getState().layout[2]?.wide).toBe(true);

    await user.click(screen.getByRole("button", { name: "Remove Recent" }));
    expect(screen.queryByRole("region", { name: "Recent" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(useStartStore.getState().layout.map((p) => p.id)).toEqual(
      DEFAULT_LAYOUT.map((p) => p.id),
    );
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(useStartStore.getState().editing).toBe(false);
  });
});

describe("StartPage: the default layout and Today", () => {
  beforeEach(() => {
    localStorage.clear();
    useStartStore.setState({ layout: DEFAULT_LAYOUT.map((p) => ({ ...p })), editing: false });
    apiMock.taggedNotes.mockReset().mockResolvedValue([]);
    apiMock.readNote.mockReset().mockResolvedValue({ path: "x", mtime: 0, content: "" });
    apiMock.listTasks.mockReset().mockResolvedValue([]);
    useMeetingStore.setState({ meetings: [], loaded: true });
    useTaskStore.setState({ tasks: [], loaded: true });
    useRecent.setState({ paths: [] });
    useVaultStore.setState({ tree: [], files: [], reloadNonce: 0 });
  });

  it("starts with Today, Pinned, Recent, Progress, Plans and This week, and Today is wide", () => {
    expect(DEFAULT_LAYOUT.map((p) => p.id)).toEqual([
      "today",
      "pinned",
      "recent",
      "epics",
      "plans",
      "week",
    ]);
    expect(DEFAULT_LAYOUT[0]?.wide).toBe(true);
  });

  it("says nothing is planned when there is no meeting, task or last page", async () => {
    render(<StartPage />);
    expect(await screen.findByText("Nothing planned today.")).toBeInTheDocument();
  });

  it("lists what is Doing and Waiting, and where you left off, and leaves out empty parts", async () => {
    const doing = makeTask({ title: "Send the offer", status: "doing", key: "a", line: 1 });
    const waiting = makeTask({ title: "Order licences", status: "waiting", key: "b", line: 2 });
    const done = makeTask({ title: "Old thing", status: "doing", done: true, key: "c", line: 3 });
    apiMock.listTasks.mockResolvedValue([doing, waiting, done] as never[]);
    useTaskStore.setState({ tasks: [doing, waiting, done] });
    useRecent.setState({ paths: ["Work/Hiring plan.md"] });
    useVaultStore.setState({
      tree: [file("Work/Hiring plan.md", Date.now())],
      files: [],
      reloadNonce: 0,
    });
    render(<StartPage />);
    const today = await screen.findByRole("region", { name: "Today" });
    expect(within(today).getByText("Send the offer")).toBeInTheDocument();
    expect(within(today).getByText("Order licences")).toBeInTheDocument();
    expect(within(today).queryByText("Old thing")).toBeNull();
    expect(within(today).getByText("You left off here:")).toBeInTheDocument();
    expect(within(today).queryByText("Nothing planned today.")).toBeNull();
    await userEvent.setup().click(within(today).getByRole("button", { name: "Continue" }));
    expect(openFile).toHaveBeenCalledWith("Work/Hiring plan.md");
  });

  it("opens a task from Today", async () => {
    const doing = makeTask({ title: "Send the offer", status: "doing", key: "a", line: 1 });
    apiMock.listTasks.mockResolvedValue([doing] as never[]);
    useTaskStore.setState({ tasks: [doing] });
    render(<StartPage />);
    await userEvent.setup().click(await screen.findByText("Send the offer"));
    expect(useTaskStore.getState().selected?.title).toBe("Send the offer");
  });

  it("has a grid of cards that stretch to the same height", () => {
    render(<StartPage />);
    expect(screen.getByTestId("start-grid").className).not.toContain("items-start");
  });
});
