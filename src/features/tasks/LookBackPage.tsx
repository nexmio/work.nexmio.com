import { ChevronLeft, ChevronRight, Copy, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BetaBadge } from "@/components/BetaBadge";
import { ViewHeader } from "@/components/ViewHeader";
import { Button } from "@/components/ui/button";
import { PlainButton } from "@/components/ui/plain-button";
import { Select } from "@/components/ui/select";
import { openNavArea } from "@/lib/actions";
import { copyText } from "@/lib/clipboard";
import { changeText, isEmpty, reportMarkdown, weekOf, type LookBack } from "@/lib/lookBack";
import { readWeek, writeReport } from "@/lib/lookBackReport";
import { formatDuration } from "@/lib/timeLog";
import { useAiBlocked } from "@/lib/useAiBlocked";
import { useMeetingStore } from "@/stores/meetingStore";
import { useTaskStore } from "@/stores/taskStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

/** `16 Nov` from `2026-11-16`. */
function shortDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** A weekday from `2026-11-16`: `Mon`. */
function weekday(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}

const ROW =
  "w-full rounded-md px-2 py-1 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";

function Card({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <h3 className="section-label pb-1">{title}</h3>
      {empty ? <p className="text-sm text-muted-foreground">Nothing this week.</p> : children}
    </section>
  );
}

/**
 * Look back: what happened in a week (Monday to Sunday, this week up to today), read from the
 * vault: tasks done and moved on (their history), time logged, meetings and their decisions, and
 * pages written (the page history). Narrow it to a project; copy it as a status report, or let
 * the AI write one in the queue.
 */
export function LookBackPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const meetings = useMeetingStore((s) => s.meetings);
  const projects = useVaultStore((s) => s.projects);
  const aiOff = useAiBlocked();
  const [offset, setOffset] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [data, setData] = useState<LookBack | null>(null);
  const project = projects.find((p) => p.id === projectId) ?? null;
  const week = weekOf(offset);

  useEffect(() => {
    let live = true;
    readWeek(offset, project)
      .then((r) => {
        if (live) setData(r.data);
      })
      .catch(reportError);
    return () => {
      live = false;
    };
    // The week is read again when the tasks or meetings change.
  }, [offset, project, tasks, meetings]);

  const title =
    offset === 0
      ? `This week · ${shortDay(week.from)} – today`
      : `Week ${String(week.number)} · ${shortDay(week.from)} – ${shortDay(week.to)}`;

  return (
    <section aria-label="Look back" className="flex h-full min-h-0 flex-col bg-background">
      <ViewHeader
        title="Look back"
        back={{
          label: "Tasks",
          run: () => {
            useUiStore.getState().setCenterView("tasks");
          },
        }}
      />
      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              aria-label="The week before"
              onClick={() => {
                setOffset(offset - 1);
              }}
            >
              <ChevronLeft /> Before
            </Button>
            <span className="text-sm font-semibold">{title}</span>
            <Button
              size="sm"
              variant="outline"
              aria-label="The week after"
              disabled={offset === 0}
              onClick={() => {
                setOffset(offset + 1);
              }}
            >
              After <ChevronRight />
            </Button>
            <label className="ml-auto flex items-center gap-2 text-sm">
              Project
              <Select
                aria-label="Project"
                value={projectId ?? ""}
                onChange={(e) => {
                  setProjectId(e.target.value === "" ? null : e.target.value);
                }}
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={data === null}
              onClick={() => {
                if (data !== null) void copyText(reportMarkdown(data, week, project));
              }}
            >
              <Copy /> Copy as a status report
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-primary"
              disabled={aiOff !== null || data === null || isEmpty(data)}
              title={aiOff ?? "The AI writes a short report in the AI queue"}
              onClick={() => {
                writeReport(offset, project);
              }}
            >
              <Sparkles /> Write it for me <BetaBadge />
            </Button>
          </div>
          {data === null ? (
            <p className="text-sm text-muted-foreground">Reading the week…</p>
          ) : (
            <div className="grid gap-4 @container md:grid-cols-2">
              <Card title={`Done · ${String(data.done.length)}`} empty={data.done.length === 0}>
                <ul>
                  {data.done.map((d) => (
                    <li key={`${d.task.path}:${d.task.title}`}>
                      <PlainButton
                        type="button"
                        className={ROW}
                        onClick={() => {
                          useTaskStore.getState().openEpic(d.task.path);
                        }}
                      >
                        {d.task.title}{" "}
                        <span className="text-muted-foreground">
                          · {d.epic} · {weekday(d.date)}
                        </span>
                      </PlainButton>
                    </li>
                  ))}
                </ul>
                {data.moved.length > 0 && (
                  <>
                    <h3 className="section-label pb-1 pt-2">
                      Moved on · {String(data.moved.length)}
                    </h3>
                    <ul>
                      {data.moved.map((m) => (
                        <li key={`${m.task.path}:${m.task.title}`}>
                          <PlainButton
                            type="button"
                            className={ROW}
                            onClick={() => {
                              useTaskStore.getState().openEpic(m.task.path);
                            }}
                          >
                            {m.task.title}{" "}
                            <span className="text-muted-foreground">· {changeText(m.change)}</span>
                          </PlainButton>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
              <Card
                title={data.minutes === 0 ? "Time" : `Time · ${formatDuration(data.minutes)}`}
                empty={data.time.length === 0}
              >
                <ul className="flex flex-col gap-1.5 px-2">
                  {data.time.map((t) => (
                    <li key={t.epic} className="flex items-center gap-2 text-sm">
                      <span className="w-32 truncate">{t.epic}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full bg-primary"
                          style={{ width: `${String((t.minutes / data.minutes) * 100)}%` }}
                        />
                      </span>
                      <span className="w-20 text-right tabular-nums">
                        {formatDuration(t.minutes)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card
                title={`Meetings · ${String(data.meetings.length)}`}
                empty={data.meetings.length === 0}
              >
                <ul>
                  {data.meetings.map((m) => (
                    <li key={m.meeting.path}>
                      <PlainButton
                        type="button"
                        className={ROW}
                        onClick={() => {
                          openNavArea("meetings");
                          useMeetingStore.getState().select(m.meeting.path);
                        }}
                      >
                        <span className="font-medium">{m.meeting.meeting.title}</span>{" "}
                        <span className="text-muted-foreground">
                          · {weekday(m.meeting.meeting.date ?? "")} {m.meeting.meeting.time ?? ""}
                        </span>
                      </PlainButton>
                      {m.decisions.length > 0 && (
                        <ul className="pb-1 pl-5 text-sm text-muted-foreground">
                          {m.decisions.map((d) => (
                            <li key={d}>Decided: {d}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card
                title={`Pages written · ${String(data.pages.length)}`}
                empty={data.pages.length === 0}
              >
                <ul>
                  {data.pages.map((p) => (
                    <li key={p.path}>
                      <PlainButton
                        type="button"
                        className={ROW}
                        onClick={() => {
                          void useVaultStore.getState().openNote(p.path);
                        }}
                      >
                        {p.path.replace(/\.md$/, "").split("/").pop()}{" "}
                        <span className="text-muted-foreground">
                          ·{" "}
                          {p.new
                            ? "new"
                            : p.changes === 1
                              ? "changed"
                              : `changed ${String(p.changes)} times`}
                        </span>
                      </PlainButton>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
