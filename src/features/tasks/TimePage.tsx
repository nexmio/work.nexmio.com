import { useMemo, useState } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { Button } from "@/components/ui/button";
import { PlainButton } from "@/components/ui/plain-button";
import { Select } from "@/components/ui/select";
import { copyText } from "@/lib/clipboard";
import { noteName, taskHasTag, usedTags } from "@/lib/taskLogic";
import {
  entriesIn,
  formatDuration,
  PERIODS,
  periodRange,
  timeCsv,
  timeEntriesOf,
  type Period,
  type TimeEntry,
} from "@/lib/timeLog";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/stores/taskStore";
import { useTimerStore } from "@/stores/timerStore";
import { useUiStore } from "@/stores/uiStore";
import { StartTimer } from "./TimerPanel";

type Mode = "task" | "day";

/** A time with a short date: `12 Nov`. */
function shortDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * Time: what each task took, from the time lines in the logs. Narrow it to a tag (a task counts
 * for the tags of its epic too) and to a period, see it by task or by day, and copy it as CSV for
 * an invoice or a time sheet.
 */
export function TimePage() {
  const running = useTimerStore((s) => s.running);
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const [tag, setTag] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [mode, setMode] = useState<Mode>("task");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const tags = useMemo(() => usedTags(tasks, epics), [tasks, epics]);
  const entries = useMemo(() => {
    const all: TimeEntry[] = [];
    for (const t of tasks) {
      if (tag !== null && !taskHasTag(t, epics, tag)) continue;
      all.push(...timeEntriesOf(t));
    }
    return entriesIn(all, periodRange(period)).sort(
      (a, b) => a.date.localeCompare(b.date) || (a.span ?? "").localeCompare(b.span ?? ""),
    );
  }, [tasks, epics, tag, period]);

  const total = entries.reduce((n, e) => n + e.minutes, 0);
  const epicOf = (e: TimeEntry): string =>
    epics.find((x) => x.path === e.task.path)?.title ?? noteName(e.task.path);
  const idOf = (t: { path: string; title: string }): string => `${t.path}:${t.title}`;

  const byTask = useMemo(() => {
    const map = new Map<string, { task: TimeEntry["task"]; list: TimeEntry[] }>();
    for (const e of entries) {
      const id = idOf(e.task);
      const g = map.get(id) ?? { task: e.task, list: [] };
      g.list.push(e);
      map.set(id, g);
    }
    return [...map.values()].sort(
      (a, b) =>
        b.list.reduce((n, e) => n + e.minutes, 0) - a.list.reduce((n, e) => n + e.minutes, 0),
    );
  }, [entries]);
  const byDay = useMemo(() => {
    const map = new Map<string, TimeEntry[]>();
    for (const e of entries) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [entries]);

  const copy = (): void => {
    void copyText(
      timeCsv(
        entries.map((e) => ({
          date: e.date,
          task: e.task.title,
          epic: epicOf(e),
          tags: [
            ...new Set([
              ...e.task.tags,
              ...(epics.find((x) => x.path === e.task.path)?.tags ?? []),
            ]),
          ]
            .map((t) => `#${t}`)
            .join(" "),
          span: e.span,
          minutes: e.minutes,
          note: e.note,
        })),
      ),
    );
  };

  return (
    <section aria-label="Time" className="flex h-full min-h-0 flex-col bg-background">
      <ViewHeader
        title="Time"
        back={{
          label: "Tasks",
          run: () => {
            useUiStore.getState().setCenterView("tasks");
          },
        }}
      >
        <Button size="sm" variant="outline" disabled={entries.length === 0} onClick={copy}>
          Copy as CSV
        </Button>
      </ViewHeader>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {running === null ? (
            <section aria-label="Start a timer" className="rounded-lg border p-4">
              <StartTimer />
            </section>
          ) : (
            <p className="rounded-lg border p-3 text-sm">
              A timer is running: “{running.title}”. It is in the Timer tab of the right panel.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              Tag
              <Select
                aria-label="Tag"
                value={tag ?? ""}
                onChange={(e) => {
                  setTag(e.target.value === "" ? null : e.target.value);
                }}
              >
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              Period
              <Select
                aria-label="Period"
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value as Period);
                }}
              >
                {PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </label>
            <div
              role="group"
              aria-label="Show"
              className="ml-auto flex overflow-hidden rounded-md border text-sm"
            >
              {(["task", "day"] as const).map((m, i) => (
                <PlainButton
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  className={cn(
                    "px-3 py-1",
                    i > 0 && "border-l",
                    mode === m
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "hover:bg-muted",
                  )}
                  onClick={() => {
                    setMode(m);
                  }}
                >
                  {m === "task" ? "By task" : "By day"}
                </PlainButton>
              ))}
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-card p-3">
              <dt className="text-xs text-muted-foreground">Total</dt>
              <dd className="text-2xl font-semibold" data-testid="time-total">
                {total === 0 ? "0 min" : formatDuration(total)}
              </dd>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <dt className="text-xs text-muted-foreground">Entries</dt>
              <dd className="text-2xl font-semibold">{entries.length}</dd>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <dt className="text-xs text-muted-foreground">Tasks</dt>
              <dd className="text-2xl font-semibold">{byTask.length}</dd>
            </div>
          </dl>
          {entries.length === 0 && (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No time in this period. Start a timer in the Timer tab of the right panel, and the
              time is written in the task's log when you stop it.
            </p>
          )}
          {mode === "task" && byTask.length > 0 && (
            <ul className="overflow-hidden rounded-xl border bg-card">
              {byTask.map(({ task, list }) => {
                const id = idOf(task);
                const minutes = list.reduce((n, e) => n + e.minutes, 0);
                return (
                  <li key={id} className="border-b last:border-b-0">
                    <PlainButton
                      type="button"
                      aria-expanded={open[id] === true}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setOpen({ ...open, [id]: open[id] !== true });
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {open[id] === true ? "▾" : "▸"} {task.title}
                      </span>
                      <span className="w-32 truncate text-xs text-muted-foreground">
                        {epicOf(list[0] as TimeEntry)}
                      </span>
                      <span className="w-20 text-right text-xs text-muted-foreground">
                        {list.length} {list.length === 1 ? "entry" : "entries"}
                      </span>
                      <span className="w-24 text-right tabular-nums">
                        {formatDuration(minutes)}
                      </span>
                    </PlainButton>
                    {open[id] === true && (
                      <ul className="border-t bg-background/50 px-3 py-1.5 text-xs text-muted-foreground">
                        {list.map((e, i) => (
                          <li key={`${e.date}-${String(i)}`} className="flex gap-3 py-0.5 pl-4">
                            <span className="w-40">
                              {shortDay(e.date)}
                              {e.span !== null && ` · ${e.span}`}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{e.note}</span>
                            <span className="w-24 text-right tabular-nums">
                              {formatDuration(e.minutes)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {mode === "day" && byDay.length > 0 && (
            <ul className="overflow-hidden rounded-xl border bg-card">
              {byDay.map(([day, list]) => (
                <li key={day} className="border-b px-3 py-2.5 text-sm last:border-b-0">
                  <p className="flex">
                    <span className="flex-1 font-medium">{shortDay(day)}</span>
                    <span className="tabular-nums">
                      {formatDuration(list.reduce((n, e) => n + e.minutes, 0))}
                    </span>
                  </p>
                  <ul className="mt-1 text-xs text-muted-foreground">
                    {list.map((e, i) => (
                      <li key={`${e.task.title}-${String(i)}`} className="flex gap-3 py-0.5">
                        <span className="min-w-0 flex-1 truncate">{e.task.title}</span>
                        <span className="w-24">{e.span ?? ""}</span>
                        <span className="w-24 text-right tabular-nums">
                          {formatDuration(e.minutes)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
