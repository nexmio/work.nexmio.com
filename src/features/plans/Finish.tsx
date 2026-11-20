import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { addChild, removeMany, splitText } from "@/lib/planTree";
import { dirname } from "@/lib/utils";
import { planHome, usePlanStore } from "@/stores/planStore";
import { reportError } from "@/stores/uiStore";
import { infoFor, linkTarget } from "./nodeInfo";
import { usePlanContext } from "./usePlanContext";
import { Shell, close } from "./PlanDialogShell";

// --- Finish the plan, or carry the rest over --------------------------------------------------

export function Finish() {
  const nodes = usePlanStore((s) => s.nodes);
  const title = usePlanStore((s) => s.title);
  const planPath = usePlanStore((s) => s.path);
  const ctx = usePlanContext(planPath);
  const [mode, setMode] = useState<"carry" | "finish" | "keep">("carry");
  const [name, setName] = useState(`${title} (continued)`);
  const open = nodes
    .map((n, i) => ({ n, i, info: infoFor(n, ctx) }))
    .filter(
      ({ info }) =>
        !(
          info.task?.done === true ||
          (info.epic !== null && info.epic.total > 0 && info.epic.done === info.epic.total)
        ),
    );
  const [picked, setPicked] = useState<ReadonlySet<number>>(new Set(open.map((o) => o.i)));
  const [busy, setBusy] = useState(false);
  const flip = (i: number): void => {
    setPicked((c) => {
      const next = new Set(c);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const go = async (): Promise<void> => {
    const store = usePlanStore.getState();
    if (mode === "keep") {
      close();
      return;
    }
    setBusy(true);
    try {
      if (mode === "carry" && picked.size > 0) {
        const moving = [...picked].sort((a, b) => a - b);
        const moved = moving.flatMap((i) => (nodes[i] ? [nodes[i]] : []));
        const place =
          planPath !== null && planHome(planPath).epics !== undefined
            ? { folder: dirname(planPath) }
            : "plans";
        const created = await store.create(name.trim(), moved, false, place);
        if (created === null) return;
        const line = `Moved to [[${linkTarget(created)}]]`;
        await store.edit(
          (all) =>
            addChild(
              removeMany(
                all,
                moving.map((i) => [i]),
              ),
              [],
              line,
            ).nodes,
        );
        await store.setFinished(true);
        await store.open(created);
      } else {
        await store.setFinished(true);
      }
      close();
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  };

  const choice = (id: typeof mode, label: string, help: string) => (
    <label
      className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2 ${mode === id ? "border-2 border-primary bg-accent" : ""}`}
    >
      <Radio
        name="finish-mode"
        className="mt-1"
        checked={mode === id}
        onChange={() => {
          setMode(id);
        }}
      />
      <span className="text-sm">
        <b>{label}</b>
        <span className="block text-xs text-muted-foreground">{help}</span>
      </span>
    </label>
  );

  return (
    <Shell
      title={`Archive “${title}”?`}
      description="An archived plan is put away under Archived: it stays readable, with its pages and epics, and you can open it again. Choose what happens to what is still open."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => void go()}>
            {mode === "keep"
              ? "Keep it going"
              : mode === "carry"
                ? "Archive and carry over"
                : "Archive it"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {choice(
          "carry",
          "Carry the open things over to a new plan",
          "Pick what continues. This plan keeps a line, “Moved to …”.",
        )}
        {mode === "carry" && (
          <div className="ml-7 flex flex-col gap-1.5">
            {open.length === 0 && <p className="text-sm text-muted-foreground">Nothing is open.</p>}
            {open.map(({ n, i }) => (
              <label key={i} className="flex items-start gap-3 text-sm">
                <Checkbox
                  className="mt-1"
                  checked={picked.has(i)}
                  onChange={() => {
                    flip(i);
                  }}
                />
                {splitText(n.text).plain}
              </label>
            ))}
            <label className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
              Name of the new plan
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </label>
            <span className="text-xs text-muted-foreground">
              Epics and tasks go with their part. Nothing is copied, so there is still only one of
              each.
            </span>
          </div>
        )}
        {choice(
          "finish",
          "Just archive it",
          "Move it to Archived as it is. What is open stays in it.",
        )}
        {choice("keep", "Not yet", "Keep it going. A plan can be ongoing for a long time.")}
      </div>
    </Shell>
  );
}
