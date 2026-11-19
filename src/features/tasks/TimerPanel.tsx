import { Play, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlainButton } from "@/components/ui/plain-button";
import { Select } from "@/components/ui/select";
import { epicGroups, isOpen, LOOSE_NOTE, noteName, todayIso } from "@/lib/taskLogic";
import { clockText, formatDuration, timeEntriesOf } from "@/lib/timeLog";
import { cn } from "@/lib/utils";
import { findTask, useTaskStore } from "@/stores/taskStore";
import { useTimerStore } from "@/stores/timerStore";
import { useTick } from "./useTick";

/** The time registered today, task by task. */
function useToday() {
  const tasks = useTaskStore((s) => s.tasks);
  return useMemo(() => {
    const today = todayIso();
    const rows: { title: string; minutes: number }[] = [];
    for (const t of tasks) {
      const minutes = timeEntriesOf(t)
        .filter((e) => e.date === today)
        .reduce((n, e) => n + e.minutes, 0);
      if (minutes > 0) rows.push({ title: t.title, minutes });
    }
    return rows;
  }, [tasks]);
}

/** A timer that is running: its clock, what it is for and how to stop it. */
function Running() {
  const running = useTimerStore((s) => s.running);
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const [note, setNote] = useState("");
  const now = useTick(running !== null);
  if (running === null) return null;
  const elapsed = now - running.startedAt;
  const task = findTask(tasks, running);
  const epic = epics.find((e) => e.path === running.path);
  return (
    <div className="flex flex-col gap-2">
      <span className="section-label text-success">Running</span>
      <p
        aria-label="Time on the timer"
        className="text-3xl font-semibold tabular-nums"
        role="timer"
      >
        {clockText(elapsed)}
      </p>
      <h3 className="text-base font-semibold leading-snug">{running.title}</h3>
      <p className="text-xs text-muted-foreground">
        Task in{" "}
        {epic?.title ?? (running.path === LOOSE_NOTE ? "Loose tasks" : noteName(running.path))}
        {epic !== undefined &&
          epic.tags.length > 0 &&
          ` · ${epic.tags.map((t) => `#${t}`).join(" ")}`}
      </p>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            const n = note;
            setNote("");
            void useTimerStore.getState().stop(n);
          }}
        >
          <Square /> Stop
        </Button>
        <Button
          variant="outline"
          disabled={task === null}
          onClick={() => {
            if (task !== null) useTaskStore.getState().open(task);
          }}
        >
          Open the task
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="timer-note">Note for the log (optional)</Label>
        <Input
          id="timer-note"
          placeholder="What did you do?"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
          }}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        When you stop, one line is added to the task's log, for example “1 h 20 min · 09:00–10:20”.
      </p>
    </div>
  );
}

/** Starting a timer: on a new task (in an epic, found by a tag if you like) or on one you have. */
export function StartTimer() {
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const epicOrder = useTaskStore((s) => s.epicOrder);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [epicPath, setEpicPath] = useState("");

  const groups = useMemo(
    () => epicGroups(tasks, epics, epicOrder).filter((g) => g.adopted),
    [tasks, epics, epicOrder],
  );
  const epicTags = useMemo(
    () => [...new Set(epics.flatMap((e) => e.tags))].sort((a, b) => a.localeCompare(b)),
    [epics],
  );
  const withTag =
    tag === null
      ? []
      : groups.filter((g) => epics.find((e) => e.path === g.path)?.tags.includes(tag));
  // The epic: the one chosen, else the first with the chosen tag, else none: the task is loose
  // until it is moved into an epic.
  const chosen =
    epicPath === LOOSE_NOTE
      ? LOOSE_NOTE
      : (groups.find((g) => g.path === epicPath)?.path ?? withTag[0]?.path ?? LOOSE_NOTE);
  const startable = tasks
    .filter((t) => isOpen(t) && (t.path === LOOSE_NOTE || groups.some((g) => g.path === t.path)))
    .sort((a, b) => Number(b.status === "doing") - Number(a.status === "doing"))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold">Start a timer</h3>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim() === "") return;
          void useTimerStore
            .getState()
            .startNew({ title, epicPath: chosen })
            .then((ok) => {
              if (ok) setTitle("");
            });
        }}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="timer-title">What are you doing?</Label>
          <Input
            id="timer-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
        </div>
        {epicTags.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Tag (if you want one)</span>
            <ul aria-label="Choose an epic by its tag" className="flex flex-wrap gap-1.5">
              {epicTags.map((t) => (
                <li key={t}>
                  <PlainButton
                    type="button"
                    aria-pressed={tag === t}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs focus-visible:ring-2 focus-visible:ring-ring",
                      tag === t
                        ? "border-primary bg-accent text-accent-foreground"
                        : "hover:bg-muted",
                    )}
                    onClick={() => {
                      setTag(tag === t ? null : t);
                      setEpicPath("");
                    }}
                  >
                    #{t}
                  </PlainButton>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <Label htmlFor="timer-epic">In the epic</Label>
          <Select
            id="timer-epic"
            value={chosen}
            onChange={(e) => {
              setEpicPath(e.target.value);
            }}
          >
            <option value={LOOSE_NOTE}>No epic (Loose tasks)</option>
            {groups.map((g) => (
              <option key={g.path} value={g.path}>
                {g.title}
              </option>
            ))}
          </Select>
          {tag !== null && withTag.length > 1 && (
            <p className="text-xs text-muted-foreground">
              More than one epic has #{tag}. Choose the one this belongs to.
            </p>
          )}
        </div>
        <Button type="submit" disabled={title.trim() === ""}>
          <Play /> Start timer
        </Button>
      </form>
      {startable.length > 0 && (
        <section
          aria-label="Start on a task you have"
          className="flex flex-col gap-1.5 border-t pt-3"
        >
          <h4 className="section-label">Or start on a task you have</h4>
          <ul className="flex flex-col gap-1.5">
            {startable.map((t) => (
              <li
                key={`${t.path}:${String(t.line)}`}
                className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Start the timer on ${t.title}`}
                  onClick={() => {
                    void useTimerStore.getState().start(t);
                  }}
                >
                  <Play /> Start
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * The Timer tab of the right panel. It is there only while a timer runs, so it keeps going beside
 * the page you are writing; stop it to put the time in the task's log. The same clock is in the
 * status bar. A timer is started under Tasks → Time (`StartTimer`).
 */
export function TimerPanel() {
  const running = useTimerStore((s) => s.running);
  const today = useToday();
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-4 text-sm">
      {running === null ? (
        <p className="text-xs text-muted-foreground">
          No timer is running. Start one under Tasks → Time.
        </p>
      ) : (
        <>
          <Running />
          {today.length > 0 && (
            <section aria-label="Today" className="flex flex-col gap-1 border-t pt-3">
              <h4 className="section-label">Today</h4>
              {today.map((r) => (
                <p key={r.title} className="flex text-xs">
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  <span className="text-muted-foreground">{formatDuration(r.minutes)}</span>
                </p>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
