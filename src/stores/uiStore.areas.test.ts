import { beforeEach, describe, expect, it } from "vitest";
import { makeTask } from "@/test/taskFixtures";
import { useTaskStore } from "./taskStore";
import { useUiStore } from "./uiStore";

describe("uiStore: the left panel follows the page in the middle", () => {
  beforeEach(() => {
    useUiStore.setState({ leftTab: "plans", leftCollapsed: false, centerView: "plans" });
  });

  it("opening a task from a plan brings the Tasks list to the left", () => {
    useTaskStore.getState().open(makeTask());
    const s = useUiStore.getState();
    expect(s.centerView).toBe("task");
    expect(s.leftTab).toBe("tasks");
  });

  it("opening an epic from a plan brings the Tasks list to the left", () => {
    useTaskStore.getState().openEpic("Tasks/Move.md");
    const s = useUiStore.getState();
    expect(s.centerView).toBe("epic");
    expect(s.leftTab).toBe("tasks");
  });

  it("opening a task from the pages, the start page or a search does the same", () => {
    for (const tab of ["files", "search"] as const) {
      useUiStore.setState({ leftTab: tab, centerView: "notes" });
      useTaskStore.getState().open(makeTask());
      expect(useUiStore.getState().leftTab).toBe("tasks");
    }
  });

  it("a meeting or a plan shown in the middle brings its own list to the left", () => {
    useUiStore.setState({ leftTab: "tasks", centerView: "task" });
    useUiStore.getState().setCenterView("meetings");
    expect(useUiStore.getState().leftTab).toBe("meetings");
    useUiStore.getState().setCenterView("plans");
    expect(useUiStore.getState().leftTab).toBe("plans");
  });

  it("the ideas are cards in the middle, so the list at the left folds", () => {
    useUiStore.getState().setCenterView("ideas");
    const s = useUiStore.getState();
    expect(s.leftTab).toBe("ideas");
    expect(s.leftCollapsed).toBe(true);
  });

  it("a panel the person folded stays folded when a task opens", () => {
    useUiStore.setState({ leftCollapsed: true });
    useTaskStore.getState().open(makeTask());
    expect(useUiStore.getState().leftCollapsed).toBe(true);
  });

  it("back to the pages shows the files again", () => {
    useUiStore.setState({ leftTab: "tasks", centerView: "task" });
    useUiStore.getState().setCenterView("notes");
    expect(useUiStore.getState().leftTab).toBe("files");
  });
});
