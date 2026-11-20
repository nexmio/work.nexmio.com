import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { walk } from "@/lib/planTree";
import { noteName } from "@/lib/taskLogic";
import { usePlanStore } from "@/stores/planStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { infoFor } from "./nodeInfo";
import { usePlanContext } from "./usePlanContext";
import { Shell, close } from "./PlanDialogShell";

/**
 * Deletes an archived plan. The plan's page always goes; its epic (with the tasks in it) and the
 * pages linked from its parts go only when they are ticked, and none is ticked at first. All of
 * it is saved in History first, so "Recover deleted" brings it back.
 */
export function DeletePlan() {
  const nodes = usePlanStore((s) => s.nodes);
  const title = usePlanStore((s) => s.title);
  const planPath = usePlanStore((s) => s.path);
  const ctx = usePlanContext(planPath);
  const tasks = useTaskStore((s) => s.tasks);
  const files = useVaultStore((s) => s.files);
  const choices: { path: string; label: string }[] = [];
  const seen = new Set<string>(planPath === null ? [] : [planPath]);
  const offer = (path: string, label: string): void => {
    if (seen.has(path) || !files.includes(path)) return;
    seen.add(path);
    choices.push({ path, label });
  };
  const epicLabel = (path: string): string => {
    const n = tasks.filter((t) => t.path === path).length;
    return `The epic “${noteName(path)}” with its ${String(n)} task${n === 1 ? "" : "s"}`;
  };
  if (ctx.planEpic !== null) offer(ctx.planEpic, epicLabel(ctx.planEpic));
  for (const { node } of walk(nodes)) {
    const info = infoFor(node, ctx);
    if (info.epic !== null) offer(info.epic.path, epicLabel(info.epic.path));
    for (const p of info.notes) offer(p, `The page “${noteName(p)}”`);
  }
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const flip = (p: string): void => {
    setPicked((c) => {
      const next = new Set(c);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };
  const remove = async (): Promise<void> => {
    setBusy(true);
    const ok = await usePlanStore.getState().remove([...picked]);
    setBusy(false);
    if (ok) {
      useUiStore
        .getState()
        .toast(
          `Deleted the plan “${title}”. Recover deleted in History brings it back.`,
          "success",
        );
    }
  };
  return (
    <Shell
      title={`Delete “${title}”?`}
      description="The plan's page is deleted. It is saved in History first, so you can bring it back with Recover deleted."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={busy} onClick={() => void remove()}>
            {busy
              ? "Deleting…"
              : picked.size === 0
                ? "Delete the plan"
                : `Delete the plan and ${String(picked.size)} more`}
          </Button>
        </>
      }
    >
      {choices.length > 0 && (
        <section aria-label="Also delete" className="flex flex-col gap-1.5">
          <h3 className="section-label">Also delete (only what you tick)</h3>
          <ul className="flex flex-col gap-1.5">
            {choices.map((c) => (
              <li key={c.path}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={picked.has(c.path)}
                    onChange={() => {
                      flip(c.path);
                    }}
                  />
                  {c.label}
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}
