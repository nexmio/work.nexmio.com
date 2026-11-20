import { usePlanStore } from "@/stores/planStore";
import { GuidedDialog } from "./GuidedDialog";
import { LinkNote } from "./LinkNote";
import { LinkTask } from "./LinkTask";
import { Repeat } from "./Repeat";
import { Finish } from "./Finish";
import { ImportProject } from "./ImportProject";
import { AddIdeas } from "./AddIdeas";
import { DeletePlan } from "./DeletePlan";
import { NoteDialog } from "./NoteDialog";

/** The window over the open plan, if one is asked for, and the window that makes a plan. */
export function PlanDialogs() {
  const dialog = usePlanStore((s) => s.dialog);
  const guided = usePlanStore((s) => s.guidedOpen);
  return (
    <>
      {dialog?.kind === "link" && <LinkNote path={dialog.path} />}
      {dialog?.kind === "linktask" && <LinkTask path={dialog.path} />}
      {dialog?.kind === "repeat" && <Repeat path={dialog.path} />}
      {dialog?.kind === "add" && <AddIdeas path={dialog.path} />}
      {dialog?.kind === "note" && <NoteDialog path={dialog.path} />}
      {dialog?.kind === "import" && <ImportProject folder={dialog.folder} />}
      {dialog?.kind === "finish" && <Finish />}
      {dialog?.kind === "delete" && <DeletePlan />}
      {guided && <GuidedDialog hidden={dialog !== null} />}
    </>
  );
}
