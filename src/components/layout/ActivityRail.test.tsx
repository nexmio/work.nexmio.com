import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useIdeaStore } from "@/stores/ideaStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { makeTask } from "@/test/taskFixtures";
import { ActivityRail, newAction } from "./ActivityRail";

describe("ActivityRail", () => {
  beforeEach(() => {
    useUiStore.setState({
      leftTab: "files",
      leftCollapsed: false,
      settingsOpen: false,
      centerView: "notes",
      navCollapsed: false,
    });
    useTaskStore.setState({ tasks: [], loaded: false });
    useIdeaStore.setState({ ideas: [], loaded: false });
  });

  it("lists the areas in order with a name beside each icon", () => {
    render(<ActivityRail />);
    const names = screen.getAllByRole("tab").map((t) => t.getAttribute("aria-label"));
    expect(names).toEqual(["Pages", "Tasks", "Projects", "Meetings", "Ideas"]);
    expect(screen.getByRole("tab", { name: "Projects" })).toHaveTextContent("Projects");
    expect(screen.queryByRole("tab", { name: "Search" })).toBeNull();
  });

  it("folds to icons, remembers it, and unfolds again", async () => {
    render(<ActivityRail />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Collapse the navigation" }));
    expect(useUiStore.getState().navCollapsed).toBe(true);
    expect(localStorage.getItem("nexmio.navCollapsed")).toBe("1");
    expect(screen.getByRole("tab", { name: "Tasks" })).not.toHaveTextContent("Tasks");
    await user.click(screen.getByRole("button", { name: "Expand the navigation" }));
    expect(useUiStore.getState().navCollapsed).toBe(false);
    expect(screen.getByRole("tab", { name: "Tasks" })).toHaveTextContent("Tasks");
  });

  it("shows numbers for what waits, and dots when folded, but nothing for zero", () => {
    useTaskStore.setState({
      loaded: true,
      tasks: [
        makeTask({ title: "a", line: 1, key: "a" }),
        makeTask({ title: "b", line: 2, key: "b", status: "waiting" }),
        makeTask({ title: "c", line: 3, key: "c", done: true }),
      ],
    });
    useIdeaStore.setState({ loaded: true, ideas: [] });
    const { rerender } = render(<ActivityRail />);
    expect(screen.getByTestId("nav-count")).toHaveTextContent("1");
    expect(screen.getAllByTestId("nav-count")).toHaveLength(1);
    useUiStore.setState({ navCollapsed: true });
    rerender(<ActivityRail />);
    expect(screen.getAllByTestId("nav-dot")).toHaveLength(1);
  });

  it("makes the new thing of the area that is shown", async () => {
    expect(newAction("notes").label).toBe("New page");
    expect(newAction("task").label).toBe("New task");
    expect(newAction("plans").label).toBe("New project");
    expect(newAction("meetings").label).toBe("New meeting");
    expect(newAction("ideas").label).toBe("New idea");
    expect(newAction("start").label).toBe("New");
    useUiStore.setState({ centerView: "notes", newNoteDialog: null });
    render(<ActivityRail />);
    await userEvent.setup().click(screen.getByRole("button", { name: "New page" }));
    expect(useUiStore.getState().newNoteDialog).not.toBeNull();
    act(() => {
      useUiStore.setState({ centerView: "ideas", newNoteDialog: null });
    });
    await userEvent.setup().click(screen.getByRole("button", { name: "New idea" }));
    expect(useUiStore.getState().captureKind).toBe("idea");
    act(() => {
      useUiStore.setState({ captureKind: null, centerView: "plans" });
    });
    await userEvent.setup().click(screen.getByRole("button", { name: "New project" }));
    expect(useUiStore.getState().newPlanNonce).toBe(1);
    expect(useUiStore.getState().centerView).toBe("plans");
  });

  it("the arrow next to New lists everything that can be made, whatever area is shown", async () => {
    useUiStore.setState({ centerView: "tasks", newPlanNonce: 0 });
    render(<ActivityRail />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Everything you can make" }));
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual([
      "Page",
      "Task",
      "Project",
      "Meeting",
      "Idea",
    ]);
    await user.click(screen.getByRole("menuitem", { name: "Project" }));
    expect(useUiStore.getState().newPlanNonce).toBe(1);
    expect(useUiStore.getState().centerView).toBe("plans");
  });

  it("marks the open panel and switches to another", async () => {
    render(<ActivityRail />);
    const user = userEvent.setup();
    expect(screen.getByRole("tab", { name: "Pages" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Tasks" }));
    expect(useUiStore.getState().leftTab).toBe("tasks");
    expect(screen.getByRole("tab", { name: "Tasks" })).toHaveAttribute("aria-selected", "true");
  });

  it("hides the panel when its own icon is pressed and shows it again", async () => {
    render(<ActivityRail />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Pages" }));
    expect(useUiStore.getState().leftCollapsed).toBe(true);
    await user.click(screen.getByRole("tab", { name: "Tasks" }));
    expect(useUiStore.getState().leftCollapsed).toBe(false);
    expect(useUiStore.getState().leftTab).toBe("tasks");
  });

  it("opens the start page, and Pages brings the pages back", async () => {
    render(<ActivityRail />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(useUiStore.getState().centerView).toBe("start");
    expect(screen.getByRole("button", { name: "Start" })).toHaveAttribute("aria-pressed", "true");
    // The page is shown on its own: no panel is marked as open.
    expect(screen.getByRole("tab", { name: "Pages" })).toHaveAttribute("aria-selected", "false");
    await user.click(screen.getByRole("tab", { name: "Pages" }));
    expect(useUiStore.getState().centerView).toBe("notes");
    expect(useUiStore.getState().leftCollapsed).toBe(false);
  });

  it("leaves the start page when a side panel or search is asked for", () => {
    useUiStore.getState().openStart();
    useUiStore.getState().focusSearch("vpn");
    expect(useUiStore.getState().centerView).toBe("notes");
    expect(useUiStore.getState().leftTab).toBe("search");
    useUiStore.getState().openStart();
    useUiStore.getState().toggleRight();
    expect(useUiStore.getState().centerView).toBe("notes");
    expect(useUiStore.getState().rightCollapsed).toBe(false);
  });

  it("opens the Meetings area", async () => {
    render(<ActivityRail />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Meetings" }));
    expect(useUiStore.getState().leftTab).toBe("meetings");
    expect(useUiStore.getState().centerView).toBe("meetings");
  });

  it("opens the settings", async () => {
    render(<ActivityRail />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Settings" }));
    expect(useUiStore.getState().settingsOpen).toBe(true);
  });

  it("brings the page back when Pages is pressed while Tasks is in the middle", async () => {
    useUiStore.getState().openArea("tasks");
    render(<ActivityRail />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "Pages" }));
    expect(useUiStore.getState().leftTab).toBe("files");
    expect(useUiStore.getState().centerView).toBe("notes");
  });

  it("shows the files again when the middle goes back to the pages", () => {
    useUiStore.getState().openArea("ideas");
    useUiStore.getState().setCenterView("notes");
    expect(useUiStore.getState().leftTab).toBe("files");
    useUiStore.setState({ leftTab: "search" });
    useUiStore.getState().setCenterView("notes");
    expect(useUiStore.getState().leftTab).toBe("search");
  });

  it("opens Ideas without the list panel, marks the row, and the row brings the panel back", async () => {
    render(<ActivityRail />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Ideas" }));
    expect(useUiStore.getState().leftCollapsed).toBe(true);
    expect(screen.getByRole("tab", { name: "Ideas" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Ideas" }));
    expect(useUiStore.getState().leftCollapsed).toBe(false);
  });
});
