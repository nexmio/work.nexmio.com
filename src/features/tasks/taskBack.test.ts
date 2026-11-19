import { beforeEach, describe, expect, it } from "vitest";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { rightTabsFor } from "@/components/layout/AppShell";
import { goBackFromTask, taskBackLabel } from "./taskBack";

describe("a task page remembers where it was opened from", () => {
  beforeEach(() => {
    useUiStore.setState({ centerView: "tasks", taskFrom: null });
  });

  it("opening a task as a full page records the place, and Back goes there", () => {
    useUiStore.getState().setCenterView("plans");
    useUiStore.getState().setCenterView("task");
    expect(useUiStore.getState().taskFrom).toBe("plans");
    goBackFromTask("plans", "Tasks/Epic.md");
    expect(useUiStore.getState().centerView).toBe("plans");
  });

  it("from the task list Back goes to the task list, from an epic to the epic", () => {
    useUiStore.getState().setCenterView("task");
    expect(useUiStore.getState().taskFrom).toBe("tasks");
    goBackFromTask("tasks", "Tasks/Epic.md");
    expect(useUiStore.getState().centerView).toBe("tasks");
    useUiStore.setState({ centerView: "epic" });
    useUiStore.getState().setCenterView("task");
    goBackFromTask("epic", "Tasks/Epic.md");
    expect(useUiStore.getState().centerView).toBe("epic");
    expect(useTaskStore.getState().epicPath).toBe("Tasks/Epic.md");
  });

  it("an unknown place goes back to the task list", () => {
    goBackFromTask(null, "Tasks/Epic.md");
    expect(useUiStore.getState().centerView).toBe("tasks");
  });

  it("names the place on the Back button", () => {
    expect(taskBackLabel("tasks", "VPN rollout")).toBe("Tasks");
    expect(taskBackLabel("epic", "VPN rollout")).toBe("VPN rollout");
    expect(taskBackLabel("plans", "x")).toBe("Plans");
    expect(taskBackLabel("start", "x")).toBe("Start");
    expect(taskBackLabel(null, "x")).toBe("Tasks");
  });

  it("the Task tab of the panel is only there for the list and an epic, not for the full page", () => {
    expect(rightTabsFor("tasks")[0]).toBe("task");
    expect(rightTabsFor("epic")[0]).toBe("task");
    expect(rightTabsFor("task")).not.toContain("task");
  });
});
