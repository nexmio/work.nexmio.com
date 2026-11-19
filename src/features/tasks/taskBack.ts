import type { CenterView } from "@/stores/uiStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";

/** The words on the Back button of a task page: the place the task was opened from. */
export function taskBackLabel(from: CenterView | null, epicTitle: string): string {
  switch (from) {
    case "epic":
      return epicTitle;
    case "plans":
      return "Plans";
    case "start":
      return "Start";
    case "notes":
      return "Pages";
    case "meetings":
      return "Meetings";
    case "ideas":
      return "Ideas";
    default:
      return "Tasks";
  }
}

/**
 * Goes back from a task page to the place it was opened from (the task list, the epic, a plan, the
 * start page, a page…), not always to the epic. A task that was opened from nowhere known goes
 * back to the task list.
 */
export function goBackFromTask(from: CenterView | null, epicPath: string): void {
  const ui = useUiStore.getState();
  if (from === "epic") {
    useTaskStore.getState().openEpic(epicPath);
    return;
  }
  ui.setCenterView(from === null || from === "task" ? "tasks" : from);
}
