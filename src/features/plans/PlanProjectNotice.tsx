import { useState } from "react";
import { PlainButton } from "@/components/ui/plain-button";
import { projectForPath, useVaultStore } from "@/stores/vaultStore";
import { MoveToProjectDialog } from "./MoveToProjectDialog";

/**
 * A plan lives in a project. For a plan that does not (one made before this was the rule), a line
 * above it says so and offers to move it into one. A plan that is in a project shows nothing.
 */
export function PlanProjectNotice({ planPath }: { planPath: string }) {
  const projects = useVaultStore((s) => s.projects);
  const [moving, setMoving] = useState(false);
  if (projectForPath(projects, planPath) !== null) return null;
  return (
    <div className="shrink-0 border-b px-5 py-2 text-sm text-muted-foreground">
      This plan is not in a project yet.{" "}
      <PlainButton
        type="button"
        className="text-primary underline"
        onClick={() => {
          setMoving(true);
        }}
      >
        Move it to a project…
      </PlainButton>
      <MoveToProjectDialog
        open={moving}
        planPath={planPath}
        onClose={() => {
          setMoving(false);
        }}
      />
    </div>
  );
}
