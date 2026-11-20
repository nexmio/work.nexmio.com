import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Radio } from "@/components/ui/radio";
import { isInside } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import { useVaultStore } from "@/stores/vaultStore";
import { projectIdeas } from "./projectIdeas";
import { Shell, close } from "./PlanDialogShell";

/** Makes a plan of a project that is there: a plan note in its folder, and nothing else changed. */
export function ImportProject({ folder }: { folder: string | null }) {
  const projects = useVaultStore((s) => s.projects);
  const files = useVaultStore((s) => s.files);
  const plans = usePlanStore((s) => s.plans);
  const [chosen, setChosen] = useState<string | null>(folder);
  const [withNotes, setWithNotes] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void usePlanStore.getState().load();
  }, []);
  const planOf = (f: string) => plans.find((p) => isInside(p.path, f));
  const project = projects.find((p) => p.folder === chosen);
  const have = chosen === null ? undefined : planOf(chosen);
  const go = async (): Promise<void> => {
    if (!project) return;
    setBusy(true);
    try {
      if (have) await usePlanStore.getState().open(have.path);
      else {
        const nodes = withNotes ? projectIdeas(files, project.folder) : [];
        await usePlanStore.getState().create(project.name, nodes, true, { folder: project.folder });
      }
      close();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell
      title="Make a plan of a project"
      description="The plan is a page in the project's folder. Nothing else in the project is changed or moved, and a project never becomes a plan by itself."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button disabled={busy || !project} onClick={() => void go()}>
            {have ? "Open its plan" : "Make the plan"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            There are no projects yet. A project is a folder with its own AI rules; make one in
            Files, or make a new plan, which makes its own project.
          </p>
        ) : (
          <ul aria-label="Projects" className="flex max-h-48 flex-col overflow-auto">
            {projects.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded px-2 py-1 text-sm hover:bg-muted">
                  <Radio
                    name="import-project"
                    checked={chosen === p.folder}
                    onChange={() => {
                      setChosen(p.folder);
                    }}
                  />
                  <span className="flex-1 truncate font-semibold">{p.name}</span>
                  {planOf(p.folder) && (
                    <span className="text-xs text-muted-foreground">has a plan</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
        {project && !have && (
          <label className="flex items-start gap-3 text-sm">
            <Checkbox
              className="mt-1"
              checked={withNotes}
              onChange={(e) => {
                setWithNotes(e.target.checked);
              }}
            />
            <span>
              Start the plan with the pages and epics of the project as parts
              <span className="block text-xs text-muted-foreground">
                Each one is a part that links to it, with the folders as branches. You can take out
                what you do not need.
              </span>
            </span>
          </label>
        )}
      </div>
    </Shell>
  );
}
