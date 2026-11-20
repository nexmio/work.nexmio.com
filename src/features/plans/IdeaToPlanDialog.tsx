import { useEffect, useState } from "react";
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
import { PlainButton } from "@/components/ui/plain-button";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { flushPendingWrites } from "@/lib/flush";
import {
  addChild,
  parsePlan,
  samePath,
  serializePlan,
  setNote,
  splitText,
  walk,
  type NodePath,
  type PlanNode,
} from "@/lib/planTree";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { projectForPath, useVaultStore } from "@/stores/vaultStore";

/** Adds a part (with a note) under `at` in the list, and gives where it went. */
function withPart(nodes: readonly PlanNode[], at: NodePath, text: string, note: string) {
  const r = addChild(nodes, at, text);
  return note.trim() === "" ? r.nodes : setNote(r.nodes, r.path, note);
}

/**
 * Ideas → To plan…: the idea becomes a part of the plan of the project chosen, at the top or
 * under a part. The idea's note becomes the part's note. When it is in the plan, Ideas marks the
 * idea used (`done`). It is mounted once in the app and opens from `uiStore.ideaToPlan`.
 */
export function IdeaToPlanDialog() {
  const idea = useUiStore((s) => s.ideaToPlan);
  const plans = usePlanStore((s) => s.plans);
  const projects = useVaultStore((s) => s.projects);
  const [plan, setPlan] = useState("");
  const [nodes, setNodes] = useState<PlanNode[]>([]);
  const [at, setAt] = useState<NodePath>([]);
  const [busy, setBusy] = useState(false);
  const open = plans.filter((p) => !p.finished);

  useEffect(() => {
    if (idea === null) return;
    void usePlanStore.getState().load();
    setAt([]);
    setBusy(false);
  }, [idea]);
  // The first plan is chosen until the person picks another.
  useEffect(() => {
    if (idea !== null && plan === "" && open[0]) setPlan(open[0].path);
  }, [idea, plan, open]);
  useEffect(() => {
    if (plan === "") return;
    let live = true;
    api
      .readNote(plan)
      .then((n) => {
        if (live) setNodes(parsePlan(n.content).nodes);
      })
      .catch(() => {
        if (live) setNodes([]);
      });
    setAt([]);
    return () => {
      live = false;
    };
  }, [plan]);

  const close = (): void => {
    useUiStore.getState().setIdeaToPlan(null);
  };
  const name = (path: string): string =>
    projectForPath(projects, path)?.name ?? plans.find((p) => p.path === path)?.title ?? path;

  const add = async (): Promise<void> => {
    if (idea === null || plan === "") return;
    setBusy(true);
    try {
      const store = usePlanStore.getState();
      if (store.path === plan) {
        await store.edit((list) => withPart(list, at, idea.text, idea.note));
      } else {
        await flushPendingWrites();
        const note = await api.readNote(plan);
        const parsed = parsePlan(note.content);
        await api.writeNote(
          plan,
          serializePlan({ ...parsed, nodes: withPart(parsed.nodes, at, idea.text, idea.note) }),
        );
      }
      idea.done();
      close();
      useUiStore.getState().toast(`Added to the plan of ${name(plan)}.`, "success", {
        label: "Open the plan",
        run: () => {
          useUiStore.getState().openPlan(plan);
        },
      });
    } catch (e) {
      reportError(e);
      setBusy(false);
    }
  };

  const where = (path: NodePath, label: string, depth: number) => (
    <li key={path.join(".") || "top"}>
      <PlainButton
        type="button"
        aria-pressed={samePath(at, path)}
        className={cn(
          "w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
          samePath(at, path) && "bg-accent font-semibold text-accent-foreground",
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => {
          setAt(path);
        }}
      >
        {label}
      </PlainButton>
    </li>
  );

  return (
    <Dialog
      open={idea !== null}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Put the idea in a plan</DialogTitle>
          <DialogDescription>
            “{idea?.text}” becomes a part of the plan
            {idea?.note.trim() ? ", with its note as the part's note" : ""}.
          </DialogDescription>
        </DialogHeader>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            There is no project with a plan yet. Make one in Projects, then put the idea in it.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="idea-plan">Project</Label>
              <Select
                id="idea-plan"
                value={plan}
                onChange={(e) => {
                  setPlan(e.target.value);
                }}
              >
                {open.map((p) => (
                  <option key={p.path} value={p.path}>
                    {name(p.path)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Where in the plan</span>
              <ul
                aria-label="Where in the plan"
                className="flex max-h-60 flex-col overflow-auto rounded-lg border p-1"
              >
                {where([], "At the top of the plan", 0)}
                {walk(nodes).map(({ path, node }) =>
                  where(path, `Under “${splitText(node.text).plain}”`, path.length),
                )}
              </ul>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button disabled={busy || plan === "" || open.length === 0} onClick={() => void add()}>
            Add to the plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
