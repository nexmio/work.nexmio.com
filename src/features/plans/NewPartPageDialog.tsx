import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { allFolders } from "@/features/fileTree/treeUtils";
import type { NodePath } from "@/lib/planTree";
import { planHome, usePlanStore } from "@/stores/planStore";
import { useVaultStore } from "@/stores/vaultStore";
import { partFolder } from "./partFolder";
import { makeNote, plainAt } from "./planActions";
import { Shell, close } from "./PlanDialogShell";
import { trailOf } from "./suggestParts";

/** Makes a page for a part: in the folder of the parts above it, or in another one you choose. */
export function NewPartPageDialog({ path }: { path: NodePath }) {
  const plan = usePlanStore((s) => s.path);
  const nodes = usePlanStore((s) => s.nodes);
  const tree = useVaultStore((s) => s.tree);
  const folders = useMemo(() => allFolders(tree), [tree]);
  const suggested = useMemo(
    () => (plan === null ? "" : partFolder(planHome(plan).notes, trailOf(nodes, path), folders)),
    [plan, nodes, path, folders],
  );
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const folder = chosen ?? suggested;

  return (
    <Shell
      title={`Make a page for “${plainAt(path)}”`}
      description="The page gets a line that points back to the plan, and the part points at the page."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void makeNote(path, folder).then(close);
            }}
          >
            Make the page
          </Button>
        </>
      }
    >
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Save it in
        <Select
          value={folder}
          onChange={(e) => {
            setChosen(e.target.value);
          }}
        >
          {!folders.includes(suggested) && suggested !== "" && (
            <option value={suggested}>{suggested} (new folder)</option>
          )}
          <option value="">(vault root)</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </label>
    </Shell>
  );
}
