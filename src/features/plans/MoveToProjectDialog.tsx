import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { basename } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import { reportError } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

/**
 * A plan lives in a project. For a plan that does not (one made before this was the rule), this
 * asks which project to move it into. The page is moved like any page, with its links updated;
 * nothing else changes.
 */
export function MoveToProjectDialog({
  open,
  planPath,
  onClose,
}: {
  open: boolean;
  planPath: string;
  onClose: () => void;
}) {
  const projects = useVaultStore((s) => s.projects);
  const [folder, setFolder] = useState("");
  const chosen = folder !== "" ? folder : (projects[0]?.folder ?? "");

  const move = async (): Promise<void> => {
    if (chosen === "") return;
    try {
      const to = `${chosen}/${basename(planPath)}`;
      const ok = await useVaultStore.getState().renamePath(planPath, to, true);
      if (!ok) return;
      await useVaultStore.getState().refreshTree();
      await usePlanStore.getState().load();
      await usePlanStore.getState().open(to);
      onClose();
    } catch (e) {
      reportError(e);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Move the plan to a project</DialogTitle>
          <DialogDescription>
            A plan lives in a project. The plan page is moved into the project's folder, and links
            to it are updated. The tasks and pages already made from it stay where they are.
          </DialogDescription>
        </DialogHeader>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            There is no project yet. Make one with New → Project…, then come back.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <Label htmlFor="move-plan-project">Project</Label>
            <Select
              id="move-plan-project"
              value={chosen}
              onChange={(e) => {
                setFolder(e.target.value);
              }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.folder}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={projects.length === 0}
            onClick={() => {
              void move();
            }}
          >
            Move the plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
