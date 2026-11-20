import { newNoteInCurrentFolder } from "@/lib/actions";
import { useUiStore } from "@/stores/uiStore";

/** Everything that can be made, in the order the "New" menus list it. One list for all of them. */
export const NEW_THINGS: readonly { id: string; label: string; run: () => void }[] = [
  {
    id: "page",
    label: "Page",
    run: () => {
      newNoteInCurrentFolder();
    },
  },
  {
    id: "task",
    label: "Task",
    run: () => {
      useUiStore.getState().openCapture("task");
    },
  },
  {
    id: "project",
    label: "Project",
    run: () => {
      useUiStore.getState().requestNewPlan();
    },
  },
  {
    id: "meeting",
    label: "Meeting",
    run: () => {
      useUiStore.getState().setMeetingFormOpen(true);
    },
  },
  {
    id: "idea",
    label: "Idea",
    run: () => {
      useUiStore.getState().openCapture("idea");
    },
  },
];
