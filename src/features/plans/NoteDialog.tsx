import { nodeAt, splitText, type NodePath } from "@/lib/planTree";
import { usePlanStore } from "@/stores/planStore";
import { saveNote } from "./planActions";
import { PartNote } from "./PartNote";
import { Shell, close } from "./PlanDialogShell";

/** The short note of a part, from the outline's menu (on the map it is in the right panel). */
export function NoteDialog({ path }: { path: NodePath }) {
  const nodes = usePlanStore((s) => s.nodes);
  const node = nodeAt(nodes, path);
  return (
    <Shell
      title={`Note about “${splitText(node?.text ?? "").plain}”`}
      description="A few words about what this part is for. It is kept in the plan's page, under the part."
      footer={null}
    >
      <PartNote
        note={node?.note ?? ""}
        startOpen
        onSave={(t) => {
          void saveNote(path, t);
        }}
        onDone={close}
      />
    </Shell>
  );
}
