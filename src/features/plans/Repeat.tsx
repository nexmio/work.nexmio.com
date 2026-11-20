import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  joinText,
  nodeAt,
  hasLinks,
  setChildren,
  splitText,
  type NodePath,
  type PlanNode,
} from "@/lib/planTree";
import { taskText } from "@/lib/taskLogic";
import { usePlanStore } from "@/stores/planStore";
import { useTaskStore } from "@/stores/taskStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { taskTarget } from "./nodeInfo";
import { epicOfPlan, plainAt, withPlanTag } from "./planActions";
import { RepeatPreview } from "./RepeatPreview";
import { Shell, close } from "./PlanDialogShell";

// --- Repeat the same steps for several things -------------------------------------------------

function strip(node: PlanNode): PlanNode {
  return { text: splitText(node.text).plain, children: node.children.map(strip) };
}

export function Repeat({ path }: { path: NodePath }) {
  const nodes = usePlanStore((s) => s.nodes);
  const node = nodeAt(nodes, path);
  const plain = plainAt(path);
  const steps = (node?.children ?? []).map(strip);
  // The steps move into the names, unless one is tied to something: then they stay.
  const keepSteps = (node?.children ?? []).some(hasLinks);
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const list = names
    .split("\n")
    .map((n) => n.trim())
    .filter((n) => n !== "");

  const make = async (): Promise<void> => {
    setBusy(true);
    try {
      const tasks = useTaskStore.getState();
      const plan = usePlanStore.getState().path;
      const epic = plan === null ? null : await epicOfPlan(plan);
      const made: PlanNode[] = [];
      if (epic !== null) {
        // One epic (the plan's own): a task for each name, and the steps as steps of that task.
        await tasks.addToNote(epic, withPlanTag(list.map((n) => taskText(n))));
        await tasks.load();
        for (const name of list) {
          const find = () =>
            useTaskStore
              .getState()
              .tasks.find((t) => t.path === epic && t.title === taskText(name));
          for (const s of steps) {
            const t = find();
            if (t) await useTaskStore.getState().addStep(t, taskText(s.text));
          }
          const t = find();
          made.push({
            text: joinText(name, t ? [taskTarget(epic, t.title)] : []),
            children: steps.map((s) => ({ ...s })),
          });
        }
      } else {
        for (const name of list) made.push({ text: name, children: steps.map((s) => ({ ...s })) });
      }
      // The part stays as the heading; each name becomes a part under it.
      const left = { gone: false };
      await usePlanStore.getState().edit((all) => {
        const now = nodeAt(all, path);
        if (!now) {
          left.gone = true;
          return all;
        }
        return setChildren(all, path, keepSteps ? [...now.children, ...made] : made);
      });
      if (left.gone) {
        useUiStore.getState().toast(`“${plain}” is no longer in the plan.`, "error");
      }
      close();
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title={`Repeat the steps of “${plain}”`}
      description="For things you do the same way more than once, such as asking several suppliers the same questions. Nothing is made before you press the button."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={busy || list.length === 0 || steps.length === 0}
            onClick={() => void make()}
          >
            {busy ? "Making…" : `Make ${String(list.length)} task${list.length === 1 ? "" : "s"}`}
          </Button>
        </>
      }
    >
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-auto pr-1">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          For these (one name on each line)
          <Textarea
            aria-label="Names"
            rows={3}
            value={names}
            onChange={(e) => {
              setNames(e.target.value);
            }}
          />
        </label>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This part has no parts. Write the steps as parts first, then repeat them.
          </p>
        ) : (
          <RepeatPreview
            part={plain}
            steps={steps.map((st) => st.text)}
            names={list}
            keepSteps={keepSteps}
          />
        )}
      </div>
    </Shell>
  );
}
