import type { Task } from "@/bindings/Task";
import { PlainButton } from "@/components/ui/plain-button";
import {
  afterTarget,
  statusGroups,
  waitingText,
  type EpicGroup,
  type StatusGroups,
} from "@/lib/taskLogic";
import { useTaskStore } from "@/stores/taskStore";
import { useTimerStore } from "@/stores/timerStore";
import { StatusDot } from "./StatusDot";

/** How many tasks to do are shown in an epic's row; the rest is "+ 2 more". */
const NEXT_SHOWN = 2;

/** One row of the overview: an epic (or the loose tasks) and its tasks in three columns. */
export interface Lane {
  /** The area that pressing the name opens: an epic's path or `LOOSE_AREA`. */
  area: string;
  title: string;
  /** The epic, for its progress; null for the loose tasks. */
  group: EpicGroup | null;
  lists: StatusGroups;
}

/** The lanes of the overview, from the epics that are not done and the loose tasks. */
export function lanesOf(
  groups: readonly EpicGroup[],
  loose: { area: string; tasks: readonly Task[] } | null,
  tasksOf: (g: EpicGroup) => readonly Task[],
): Lane[] {
  const lanes: Lane[] = groups
    .filter((g) => !g.allDone)
    .map((g) => ({ area: g.path, title: g.title, group: g, lists: statusGroups(tasksOf(g)) }));
  if (loose !== null) {
    const lists = statusGroups(loose.tasks);
    if (lists.working.length + lists.next.length + lists.waiting.length > 0) {
      lanes.push({ area: loose.area, title: "Loose tasks", group: null, lists });
    }
  }
  return lanes;
}

/** The tasks of the overview in the order the quick look goes through them. */
export function lanesOrder(lanes: readonly Lane[]): Task[] {
  return lanes.flatMap((l) => [
    ...l.lists.working,
    ...l.lists.next.slice(0, NEXT_SHOWN),
    ...l.lists.waiting,
  ]);
}

/** A task in a lane: its dot, and its title, which opens the quick look. */
function Line({ task, note }: { task: Task; note?: string }) {
  const running = useTimerStore((s) => s.running);
  const timed = running !== null && running.path === task.path && running.title === task.title;
  return (
    <li className="flex min-w-0 items-start gap-2">
      <span className="pt-0.5">
        <StatusDot task={task} />
      </span>
      <PlainButton
        type="button"
        className="min-w-0 flex-1 rounded-sm text-left text-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => {
          useTaskStore.getState().look({ path: task.path, line: task.line, title: task.title });
        }}
      >
        <span className="line-clamp-2">{task.title}</span>
        {timed && <span className="block text-xs font-semibold text-primary">Timer runs</span>}
        {note !== undefined && <span className="block text-xs text-muted-foreground">{note}</span>}
      </PlainButton>
    </li>
  );
}

/**
 * Every epic in one row each, with what you work on, what is next and what waits. A task opens
 * the quick look; an epic's name opens the epic.
 */
export function EpicLanes({
  lanes,
  tasks,
  onChoose,
}: {
  lanes: readonly Lane[];
  tasks: readonly Task[];
  onChoose: (area: string) => void;
}) {
  if (lanes.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-4 text-base">
        There is nothing to do in your epics. Press <b>New epic</b> to start one.
      </p>
    );
  }
  const cols = "grid grid-cols-[minmax(9rem,1fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,1.2fr)]";
  return (
    <div role="table" aria-label="All epics" className="overflow-hidden rounded-xl border bg-card">
      <div role="row" className={`${cols} border-b bg-muted/40 text-xs font-semibold`}>
        {["Epic", "Working on", "Next", "Waiting"].map((h) => (
          <span key={h} role="columnheader" className="px-3 py-2 text-muted-foreground">
            {h}
          </span>
        ))}
      </div>
      {lanes.map((l) => {
        const more = l.lists.next.length - NEXT_SHOWN;
        return (
          <div
            key={l.area}
            role="row"
            aria-label={l.title}
            className={`${cols} border-b last:border-b-0`}
          >
            <div role="cell" className="flex flex-col gap-1.5 px-3 py-2.5">
              <PlainButton
                type="button"
                className="w-fit rounded-sm text-left font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  onChoose(l.area);
                }}
              >
                {l.title}
              </PlainButton>
              {l.group !== null && (
                <>
                  <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full bg-primary"
                      style={{
                        width: `${String(l.group.total === 0 ? 0 : (l.group.done / l.group.total) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {l.group.done} of {l.group.total} done
                  </span>
                </>
              )}
            </div>
            <ul
              role="cell"
              aria-label="Working on"
              className="flex flex-col gap-2 border-l px-3 py-2.5"
            >
              {l.lists.working.map((t) => (
                <Line key={t.key} task={t} />
              ))}
            </ul>
            <ul role="cell" aria-label="Next" className="flex flex-col gap-2 border-l px-3 py-2.5">
              {l.lists.next.slice(0, NEXT_SHOWN).map((t) => (
                <Line key={t.key} task={t} />
              ))}
              {more > 0 && (
                <li>
                  <PlainButton
                    type="button"
                    className="rounded-sm text-xs text-muted-foreground hover:text-foreground hover:underline"
                    onClick={() => {
                      onChoose(l.area);
                    }}
                  >
                    + {more} more
                  </PlainButton>
                </li>
              )}
            </ul>
            <ul
              role="cell"
              aria-label="Waiting"
              className="flex flex-col gap-2 border-l px-3 py-2.5"
            >
              {l.lists.waiting.map((t) => (
                <Line
                  key={t.key}
                  task={t}
                  note={waitingText(t, t.waitingFor ?? afterTarget(tasks, t)?.title ?? null)}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
