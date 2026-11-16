import { Check, CirclePause } from "lucide-react";
import type { Task } from "@/bindings/Task";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlainButton } from "@/components/ui/plain-button";
import { nextStep } from "@/lib/taskLogic";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";

/** Shows the task in the right panel (its steps and what has happened). */
export function showTask(task: Task): void {
  useTaskStore.getState().select({ path: task.path, line: task.line, title: task.title });
  useUiStore.getState().setRightTab("task");
}

/**
 * The one task to work on now, with its next step and three plain choices: the step is done, I
 * am waiting for someone, or choose another task. Everything else in the area is kept out of
 * sight below it.
 */
export function NowCard({ task, others }: { task: Task; others: readonly Task[] }) {
  const step = nextStep(task);
  const total = task.steps.length;
  const done = task.steps.filter((s) => s.done).length;
  const store = useTaskStore.getState();

  const finish = (): void => {
    const s = task.steps[step?.index ?? -1];
    if (s !== undefined) void store.setDone(task.path, s.line, s.key, true);
    else void store.setDone(task.path, task.line, task.key, true);
  };
  const wait = (): void => {
    void store.setStatus(task, "waiting").then(() => {
      showTask(task);
    });
  };
  const choose = (other: Task): void => {
    void (async () => {
      if (task.status === "doing") await store.setStatus(task, "");
      await store.setStatus(other, "doing");
    })();
  };

  return (
    <section
      aria-label="Now"
      className="flex flex-col gap-3 rounded-xl border-2 border-primary bg-card p-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-primary">Now</span>
        {total > 0 && step !== null && (
          <span className="ml-auto text-sm text-muted-foreground">
            Step {done + 1} of {total}
          </span>
        )}
      </div>
      <PlainButton
        type="button"
        className="text-left text-xl font-semibold leading-snug focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => {
          showTask(task);
        }}
      >
        {task.title}
      </PlainButton>
      {step !== null && (
        <p className="flex items-center gap-2 text-base leading-relaxed">
          <span aria-hidden className="size-4 shrink-0 rounded border-2 border-muted-foreground" />
          <span>
            Next step: <b>{step.text}</b>
          </span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={finish}>
          <Check /> {step === null ? "Task done" : "Step done"}
        </Button>
        <Button variant="outline" onClick={wait}>
          <CirclePause /> I am waiting for someone
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={others.length === 0}>
              Choose another
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-w-sm">
            {others.map((o) => (
              <DropdownMenuItem
                key={`${o.path}:${String(o.line)}`}
                onSelect={() => {
                  choose(o);
                }}
              >
                <span className="truncate">{o.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
}
