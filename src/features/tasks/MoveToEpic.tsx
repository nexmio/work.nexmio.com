import { useState } from "react";
import type { Task } from "@/bindings/Task";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useTaskStore } from "@/stores/taskStore";

/**
 * For a loose task (one that is not in an epic): choose an epic and move the task, with its steps
 * and log, into it. Nothing is shown for a task that is in an epic already.
 */
export function MoveToEpic({ task }: { task: Task }) {
  const epics = useTaskStore((s) => s.epics);
  const [to, setTo] = useState("");
  if (epics.some((e) => e.path === task.path) || epics.length === 0) return null;
  const chosen = epics.some((e) => e.path === to) ? to : (epics[0]?.path ?? "");
  const id = `move-epic-${String(task.line)}`;
  return (
    <section aria-label="Move into an epic" className="flex flex-col gap-1.5">
      <Label htmlFor={id}>This task is loose. Move it into an epic</Label>
      <div className="flex gap-2">
        <Select
          id={id}
          className="min-w-0 flex-1"
          value={chosen}
          onChange={(e) => {
            setTo(e.target.value);
          }}
        >
          {epics.map((e) => (
            <option key={e.path} value={e.path}>
              {e.title}
            </option>
          ))}
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            void useTaskStore.getState().moveToEpic(task, chosen);
          }}
        >
          Move
        </Button>
      </div>
    </section>
  );
}
