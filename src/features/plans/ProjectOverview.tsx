import { CirclePause, Diamond } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { TreeNode } from "@/bindings/TreeNode";
import { Button } from "@/components/ui/button";
import { PlainButton } from "@/components/ui/plain-button";
import { openFile } from "@/lib/actions";
import { api } from "@/lib/api";
import { whenLabel } from "@/lib/meetingList";
import { noteName, shortDate, todayIso } from "@/lib/taskLogic";
import { formatDuration } from "@/lib/timeLog";
import { cn } from "@/lib/utils";
import { useMeetingStore } from "@/stores/meetingStore";
import { planTag } from "@/stores/planStore";
import { useTaskStore } from "@/stores/taskStore";
import { reportError } from "@/stores/uiStore";
import { projectForPath, useVaultStore } from "@/stores/vaultStore";
import { projectOverview } from "./overview";

/** Every page with when it was last changed. */
function changedByPath(tree: readonly TreeNode[]): Map<string, number> {
  const out = new Map<string, number>();
  const walk = (nodes: readonly TreeNode[]): void => {
    for (const n of nodes) {
      if (n.isDir) walk(n.children);
      else out.set(n.path, n.modified);
    }
  };
  walk(tree);
  return out;
}

function Box({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      aria-label={title}
      className={cn("flex flex-col gap-2 rounded-xl border bg-card p-4", wide && "md:col-span-2")}
    >
      <h3 className="section-label">{title}</h3>
      {children}
    </section>
  );
}

const ROW =
  "flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The Overview of a project (the third view of a plan, next to Map and Outline): how far its plan
 * has come and what to do now, the time logged this month, what waits for others, the project's
 * meetings and decisions (by its tag or folder), and its newest pages. Everything is read from
 * where it is kept; each line opens its thing.
 */
export function ProjectOverview({ planPath }: { planPath: string }) {
  const projects = useVaultStore((s) => s.projects);
  const resolver = useVaultStore((s) => s.resolver);
  const tree = useVaultStore((s) => s.tree);
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const meetings = useMeetingStore((s) => s.meetings);
  useEffect(() => {
    void useMeetingStore.getState().load();
    if (!useTaskStore.getState().loaded) void useTaskStore.getState().load();
  }, []);
  const project = projectForPath(projects, planPath);
  const today = todayIso();
  const tag = planTag(planPath);
  const [tagged, setTagged] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    const run = { cancelled: false };
    api
      .taggedNotes(tag)
      .then((notes) => {
        if (!run.cancelled) setTagged(new Set(notes.map((n) => n.path)));
      })
      .catch(reportError);
    return () => {
      run.cancelled = true;
    };
    // `tree`: a page that was made, moved or changed is looked up again.
  }, [tag, tree]);
  const o = useMemo(
    () =>
      projectOverview({
        planPath,
        folder: project?.folder ?? null,
        tag,
        tasks,
        epics,
        resolve: (t) => resolver.resolve(t),
        meetings,
        files: changedByPath(tree),
        tagged,
        today,
      }),
    [planPath, project, tag, tasks, epics, resolver, meetings, tree, tagged, today],
  );
  const share = o.total === 0 ? 0 : (o.done / o.total) * 100;

  return (
    <div className="mx-auto grid max-w-5xl gap-4 px-7 py-5 md:grid-cols-2">
      <Box title="How far" wide>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex w-56 flex-col gap-1.5">
            <span className="text-lg font-semibold">
              {o.total === 0
                ? "No tasks yet"
                : `${String(o.done)} of ${String(o.total)} tasks done`}
            </span>
            <span
              role="progressbar"
              aria-label="Tasks done"
              aria-valuemin={0}
              aria-valuemax={o.total}
              aria-valuenow={o.done}
              className="block h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <span className="block h-full bg-primary" style={{ width: `${String(share)}%` }} />
            </span>
          </div>
          <div className="flex min-w-[14rem] flex-1 flex-col gap-0.5 border-l pl-6">
            <span className="text-xs font-semibold text-primary">Now</span>
            {o.now === null ? (
              <span className="text-sm text-muted-foreground">
                {o.total === 0
                  ? "Make a task of a part on the map."
                  : "Nothing to do now: every task is done or waits."}
              </span>
            ) : (
              <span className="truncate text-base font-semibold">{o.now.title}</span>
            )}
          </div>
          {o.now !== null && (
            <Button
              size="sm"
              onClick={() => {
                if (o.now) useTaskStore.getState().open(o.now);
              }}
            >
              Open the task
            </Button>
          )}
          <div className="flex flex-col gap-0.5 border-l pl-6">
            <span className="text-xs text-muted-foreground">Time this month</span>
            <span className="text-base font-semibold">
              {o.minutesThisMonth === 0 ? "None yet" : formatDuration(o.minutesThisMonth)}
            </span>
          </div>
        </div>
      </Box>

      <Box title="Meetings">
        {o.next === null && o.past.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No meetings yet. Give a meeting this project in its window, and it shows here.
          </p>
        ) : (
          <ul>
            {[...(o.next ? [o.next] : []), ...o.past].map((m) => (
              <li key={m.path}>
                <PlainButton type="button" className={ROW} onClick={() => void openFile(m.path)}>
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">
                    {whenLabel(m.meeting, today)}
                  </span>
                  <span className={cn("min-w-0 flex-1 truncate", m === o.next && "font-semibold")}>
                    {m.meeting.title || noteName(m.path)}
                  </span>
                  {m === o.next && <span className="text-xs text-primary">next</span>}
                </PlainButton>
              </li>
            ))}
          </ul>
        )}
      </Box>

      <Box title="Decisions">
        {o.decisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The decisions of the project&apos;s meetings show here.
          </p>
        ) : (
          <ul>
            {o.decisions.slice(0, 6).map((d) => (
              <li key={`${d.meeting.path}:${d.text}`}>
                <PlainButton
                  type="button"
                  className={ROW}
                  onClick={() => void openFile(d.meeting.path)}
                >
                  <Diamond className="size-3.5 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">{d.text}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {d.meeting.meeting.date === null ? "" : shortDate(d.meeting.meeting.date)}
                  </span>
                </PlainButton>
              </li>
            ))}
          </ul>
        )}
      </Box>

      <Box title="Waiting for others">
        {o.waiting.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing waits for others.</p>
        ) : (
          <ul>
            {o.waiting.map((t) => (
              <li key={`${t.path}:${String(t.line)}`}>
                <PlainButton
                  type="button"
                  className={ROW}
                  onClick={() => {
                    useTaskStore.getState().open(t);
                  }}
                >
                  <CirclePause className="size-3.5 shrink-0 text-warning" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  {t.waitingFor !== null && (
                    <span className="max-w-[45%] shrink-0 truncate text-xs text-muted-foreground">
                      {t.waitingFor}
                    </span>
                  )}
                </PlainButton>
              </li>
            ))}
          </ul>
        )}
      </Box>

      <Box title="Newest pages">
        {o.pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {project === null
              ? "Pages with the plan's tag show here."
              : "Pages in the project's folder or with its tag show here."}
          </p>
        ) : (
          <ul>
            {o.pages.map((p) => (
              <li key={p.path}>
                <PlainButton type="button" className={ROW} onClick={() => void openFile(p.path)}>
                  <span className="min-w-0 flex-1 truncate">{noteName(p.path)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {p.modified > 0 ? shortDate(todayIso(new Date(p.modified))) : ""}
                  </span>
                </PlainButton>
              </li>
            ))}
          </ul>
        )}
      </Box>
    </div>
  );
}
