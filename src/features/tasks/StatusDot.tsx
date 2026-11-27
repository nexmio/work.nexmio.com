import { Check } from "lucide-react";
import type { Task } from "@/bindings/Task";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlainButton } from "@/components/ui/plain-button";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/stores/taskStore";

type Kind = "todo" | "doing" | "waiting" | "done";

const NAMES: Record<Kind, string> = {
  todo: "To do",
  doing: "Working on",
  waiting: "Waiting",
  done: "Done",
};

const kindOf = (task: Task): Kind =>
  task.done || task.status === "dropped"
    ? "done"
    : task.status === "doing"
      ? "doing"
      : task.status === "waiting"
        ? "waiting"
        : "todo";

/** The dot itself: empty to do, half full working on, dashed waiting, ticked done. */
export function Dot({ kind, className }: { kind: Kind; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
        kind === "todo" && "border-muted-foreground",
        kind === "doing" &&
          "border-primary bg-[linear-gradient(90deg,var(--primary)_50%,transparent_50%)]",
        kind === "waiting" && "border-dashed border-warning",
        kind === "done" && "border-primary bg-primary text-primary-foreground",
        className,
      )}
    >
      {kind === "done" && <Check className="size-2.5" strokeWidth={3} />}
    </span>
  );
}

/**
 * The status of a task as a dot at the start of its row. Pressing it shows the choices in words;
 * choosing Waiting opens the quick look, so what it waits for can be written.
 */
export function StatusDot({ task }: { task: Task }) {
  const kind = kindOf(task);
  const store = useTaskStore.getState();
  const choose = (next: Kind): void => {
    if (next === kind) return;
    void (async () => {
      if (next === "done") {
        await store.setDone(task.path, task.line, task.key, true);
        return;
      }
      if (kind === "done") await store.setDone(task.path, task.line, task.key, false);
      const now = useTaskStore
        .getState()
        .tasks.find((t) => t.path === task.path && t.title === task.title);
      await store.setStatus(now ?? task, next === "todo" ? "" : next);
      if (next === "waiting") store.look({ path: task.path, line: task.line, title: task.title });
    })();
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PlainButton
          type="button"
          aria-label={`${NAMES[kind]}: ${task.title}. Change the status`}
          title={`${NAMES[kind]}. Press to change`}
          className="rounded-full p-0.5 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Dot kind={kind} />
        </PlainButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(Object.keys(NAMES) as Kind[]).map((k) => (
          <DropdownMenuItem
            key={k}
            onSelect={() => {
              choose(k);
            }}
          >
            <Dot kind={k} /> {NAMES[k]}
            {k === kind && <span className="ml-auto text-xs text-muted-foreground">now</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
