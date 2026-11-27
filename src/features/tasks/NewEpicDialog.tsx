import { PromptDialog } from "@/components/PromptDialog";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";

/** Asks for the name of a new epic, makes it and shows it. */
export function NewEpicDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <PromptDialog
      open={open}
      title="New epic"
      label="Name"
      confirmLabel="Make it"
      initialValue=""
      validate={(v) => (v.trim() === "" ? "Enter a name" : null)}
      onCancel={onClose}
      onSubmit={(name) => {
        onClose();
        void useTaskStore
          .getState()
          .createEpic(name, false)
          .then((path) => {
            if (path === null) return;
            useTaskStore.getState().chooseArea(path);
            useUiStore.getState().setCenterView("tasks");
          });
      }}
    />
  );
}
