import { Check, Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PlainButton } from "@/components/ui/plain-button";
import { MarkdownText } from "@/components/MarkdownText";
import { shortDate, todayIso } from "@/lib/taskLogic";
import { cn } from "@/lib/utils";
import { findTask, useTaskStore } from "@/stores/taskStore";
import { useTimerStore } from "@/stores/timerStore";
import { MoveToEpic } from "./MoveToEpic";
import { TaskTags } from "./TaskTags";
import { WaitingFor } from "./WaitingFor";
import { WaitingForTask } from "./WaitingForTask";

const STATUSES: { id: string; label: string }[] = [
  { id: "", label: "To do" },
  { id: "doing", label: "Doing" },
  { id: "waiting", label: "Waiting" },
];

/**
 * The chosen task in the right panel: its status, steps and what has happened. A shorter version
 * of the task page, which opens with "Open as full page".
 */
export function TaskDetail() {
  const tasks = useTaskStore((s) => s.tasks);
  const selected = useTaskStore((s) => s.selected);
  const task = findTask(tasks, selected);
  const [step, setStep] = useState("");
  const [log, setLog] = useState("");

  if (task === null) {
    return (
      <p className="p-4 text-sm leading-relaxed text-muted-foreground">
        Choose a task to see its steps and what has happened.
      </p>
    );
  }
  const store = useTaskStore.getState();
  const status = task.status ?? "";
  const today = todayIso();
  const firstOpen = task.steps.findIndex((s) => !s.done);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-4 text-sm">
      <div className="flex items-start gap-2">
        <PlainButton
          type="button"
          role="checkbox"
          aria-checked={task.done}
          aria-label={task.done ? "Mark as not done" : "Mark as done"}
          className={cn(
            "mt-1 flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 border-muted-foreground bg-card focus-visible:ring-2 focus-visible:ring-ring",
            task.done && "border-primary bg-primary text-primary-foreground",
          )}
          onClick={() => {
            void store.setDone(task.path, task.line, task.key, !task.done);
          }}
        >
          {task.done && <Check className="size-3" aria-hidden />}
        </PlainButton>
        <h3 className="text-base font-semibold leading-snug">{task.title}</h3>
      </div>
      <div role="group" aria-label="Status" className="flex overflow-hidden rounded-md border">
        {STATUSES.map((s, i) => (
          <PlainButton
            key={s.id}
            type="button"
            aria-pressed={status === s.id}
            className={cn(
              "flex-1 px-2 py-1.5 focus-visible:ring-2 focus-visible:ring-ring",
              i > 0 && "border-l",
              status === s.id ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-muted",
            )}
            onClick={() => {
              if (status !== s.id) void store.setStatus(task, s.id);
            }}
          >
            {s.label}
          </PlainButton>
        ))}
      </div>
      <TaskTags task={task} />
      <MoveToEpic task={task} />
      {status === "waiting" && <WaitingFor task={task} />}
      {status === "waiting" && <WaitingForTask task={task} />}

      <section aria-label="Steps" className="flex flex-col gap-1.5">
        <h4 className="section-label">
          Steps
          {task.steps.length > 0 &&
            ` · ${String(task.steps.filter((s) => s.done).length)} of ${String(task.steps.length)}`}
        </h4>
        {task.steps.map((s, i) => (
          <label key={s.line} className="flex items-center gap-2 leading-relaxed">
            <Checkbox
              checked={s.done}
              aria-label={`${s.done ? "Mark as not done" : "Mark as done"}: ${s.text}`}
              onChange={() => {
                void store.setDone(task.path, s.line, s.key, !s.done);
              }}
            />
            <span
              className={cn(i === firstOpen ? "font-semibold" : s.done && "text-muted-foreground")}
            >
              {s.text}
            </span>
            {i === firstOpen && (
              <span className="ml-auto rounded-full bg-accent px-2 text-xs text-accent-foreground">
                Next
              </span>
            )}
          </label>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = step.trim();
            if (text === "") return;
            setStep("");
            void store.addStep(task, text);
          }}
        >
          <Input
            aria-label="Add a step"
            placeholder="+ Add a step"
            value={step}
            onChange={(e) => {
              setStep(e.target.value);
            }}
          />
        </form>
      </section>

      <section aria-label="What happened" className="flex flex-col gap-1.5">
        <h4 className="section-label">What happened</h4>
        {task.log.length === 0 && <p className="text-muted-foreground">Nothing written yet.</p>}
        {[...task.log].reverse().map((l) => (
          <div key={l.key} className="leading-relaxed">
            <span className="text-xs text-muted-foreground">
              {l.date === today ? "Today" : shortDate(l.date)}
            </span>
            <MarkdownText text={l.text} />
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = log.trim();
            if (text === "") return;
            setLog("");
            void store.addLog(task, text);
          }}
        >
          <Input
            aria-label="Write what happened"
            placeholder="Write what happened…"
            value={log}
            onChange={(e) => {
              setLog(e.target.value);
            }}
          />
        </form>
      </section>

      <div className="mt-auto flex flex-col gap-2">
        <Button
          disabled={task.done}
          onClick={() => {
            void useTimerStore.getState().start(task);
          }}
        >
          <Play /> Start timer on this task
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            store.open(task);
          }}
        >
          Open as full page
        </Button>
      </div>
    </div>
  );
}
