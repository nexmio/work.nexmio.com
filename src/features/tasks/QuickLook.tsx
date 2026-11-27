import { ChevronDown, ChevronUp } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { Task } from "@/bindings/Task";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { findTask, useTaskStore } from "@/stores/taskStore";
import { TaskDetail } from "./TaskDetail";

/** Whether a key press belongs to a box that is being written in. */
function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * The quick look: a task over the list, at the right, with its status, steps, what happened and
 * its timer. ↑ and ↓ go to the task before or after it in `order` (the tasks as the list shows
 * them); Esc closes it.
 */
export function QuickLook({ order }: { order: readonly Task[] }) {
  const looking = useTaskStore((s) => s.looking);
  const tasks = useTaskStore((s) => s.tasks);
  const task = findTask(tasks, looking);
  const at = task === null ? -1 : order.indexOf(task);
  const go = (by: number): void => {
    const next = order[at + by];
    if (next !== undefined) {
      useTaskStore.getState().look({ path: next.path, line: next.line, title: next.title });
    }
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (typing(e.target)) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      go(-1);
    }
  };
  return (
    <Dialog
      open={looking !== null && task !== null}
      onOpenChange={(open) => {
        if (!open) useTaskStore.getState().look(null);
      }}
    >
      <DialogContent
        aria-label="Quick look"
        className="bottom-4 left-auto right-4 top-4 h-auto max-h-none w-[440px] max-w-[92vw] translate-x-0 translate-y-0 gap-0 overflow-hidden p-0"
        onKeyDown={onKeyDown}
      >
        <DialogTitle className="sr-only">{task?.title ?? "Task"}</DialogTitle>
        <DialogDescription className="sr-only">
          The task's status, steps and what happened. Up and Down go to the next task.
        </DialogDescription>
        <div className="flex items-center gap-1 border-b px-3 py-1.5 pr-10 text-xs text-muted-foreground">
          <span className="flex-1">
            {at === -1 ? "" : `${String(at + 1)} of ${String(order.length)}`}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={at <= 0}
            onClick={() => {
              go(-1);
            }}
          >
            <ChevronUp /> Before
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={at === -1 || at >= order.length - 1}
            onClick={() => {
              go(1);
            }}
          >
            <ChevronDown /> Next
          </Button>
        </div>
        <div className="min-h-0 flex-1">{task !== null && <TaskDetail />}</div>
      </DialogContent>
    </Dialog>
  );
}
