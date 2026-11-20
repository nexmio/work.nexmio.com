import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlainButton } from "@/components/ui/plain-button";
import { type NodePath } from "@/lib/planTree";
import { basename } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import { linkTaskTo, makeTask, plainAt } from "./planActions";
import { usePlanContext } from "./usePlanContext";
import { Shell, close } from "./PlanDialogShell";

export function LinkTask({ path }: { path: NodePath }) {
  const planPath = usePlanStore((s) => s.path);
  const { tasks, groups } = usePlanContext(planPath);
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const found = tasks
    .filter((t) => !t.done && t.status !== "dropped")
    .filter((t) => query === "" || t.title.toLowerCase().includes(query))
    .slice(0, 8);
  const epicTitle = (p: string): string => groups.find((g) => g.path === p)?.title ?? basename(p);
  return (
    <Shell
      title="Link or make a task"
      description={`Choose a task that is already there for “${plainAt(path)}”, or make a new one. A new task is put in the epic of this plan (made now if it is not there), which has the name of the plan.`}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void makeTask(path).then(close);
            }}
          >
            Make a new task
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <Input
          autoFocus
          aria-label="Search for a task"
          placeholder="Part of the name"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
          }}
        />
        <ul aria-label="Matching tasks" className="flex flex-col">
          {found.map((t) => (
            <li key={`${t.path}#${t.title}`}>
              <PlainButton
                type="button"
                className="flex w-full flex-col rounded px-2 py-1 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  void linkTaskTo(path, t).then(close);
                }}
              >
                <span className="font-semibold">{t.title}</span>
                <span className="text-xs text-muted-foreground">{epicTitle(t.path)}</span>
              </PlainButton>
            </li>
          ))}
          {found.length === 0 && (
            <li className="px-2 py-1 text-xs text-muted-foreground">No open task matches.</li>
          )}
        </ul>
      </div>
    </Shell>
  );
}
