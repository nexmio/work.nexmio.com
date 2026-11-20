import { openNavArea } from "@/lib/actions";
import { useMeetingStore } from "@/stores/meetingStore";
import { useUiStore } from "@/stores/uiStore";

/**
 * Opens a place the assistant offered with "Show me". The ids are the same as
 * `ai::assistant::PLACES` in the backend; an unknown one does nothing.
 */
export function openPlace(place: string): void {
  const ui = useUiStore.getState();
  switch (place) {
    case "start":
    case "pages":
    case "tasks":
    case "meetings":
    case "ideas":
      openNavArea(place);
      return;
    case "projects":
      openNavArea("plans");
      return;
    case "time":
      ui.setCenterView("time");
      return;
    case "decisions":
      openNavArea("meetings");
      useMeetingStore.getState().showDecisions(true);
      return;
    case "new-project":
      ui.requestNewPlan();
      return;
    case "new-meeting":
      ui.setMeetingFormOpen(true);
      return;
    case "new-task":
      ui.openCapture("task");
      return;
    case "write-it-down":
      ui.openCapture();
      return;
    case "settings-ai":
      ui.openBuiltInSettings();
      return;
    case "settings-vault":
      ui.openVaultSettings();
      return;
    case "help":
      ui.openHelp();
      return;
  }
}
