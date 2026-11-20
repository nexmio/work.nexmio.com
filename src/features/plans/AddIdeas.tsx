import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nodeAt, splitText, type NodePath } from "@/lib/planTree";
import { usePlanStore } from "@/stores/planStore";
import { addIdea } from "./planActions";
import { Shell, close } from "./PlanDialogShell";

/** Writes new parts under a part (or the plan): Enter adds one and the field stays for the next. */
export function AddIdeas({ path }: { path: NodePath }) {
  const [text, setText] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const nodes = usePlanStore((s) => s.nodes);
  const title = usePlanStore((s) => s.title);
  const under = path.length === 0 ? title : (nodeAt(nodes, path)?.text ?? "");
  const add = async (): Promise<void> => {
    const t = text.trim();
    if (t === "") return;
    setText("");
    if (await addIdea(path, t)) setAdded((a) => [...a, t]);
    else setText(t);
  };
  return (
    <Shell
      title={`Add parts under “${splitText(under).plain}”`}
      description="Write a part and press Enter or Add. The field stays, so the next one can follow."
      footer={
        <Button variant="outline" onClick={close}>
          {added.length > 0 ? "Close" : "Cancel"}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            aria-label="A new part"
            placeholder="A new part"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
          />
          <Button type="submit" disabled={text.trim() === ""}>
            <Plus /> Add
          </Button>
        </div>
        {added.length > 0 && (
          <ul className="text-sm text-muted-foreground">
            {added.map((a, i) => (
              <li key={`${String(i)}-${a}`}>✓ {a}</li>
            ))}
          </ul>
        )}
      </form>
    </Shell>
  );
}
