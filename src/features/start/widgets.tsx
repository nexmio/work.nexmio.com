import { Search, Star, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlainButton } from "@/components/ui/plain-button";
import { CapturePicker } from "@/features/capture/CapturePicker";
import { useComingMeetings, type PlannedMeeting } from "@/features/meetings/MeetingLine";
import { StatusChip } from "@/features/tasks/TaskRow";
import { isManagedNote } from "@/features/fileTree/treeUtils";
import { openFile } from "@/lib/actions";
import { todayAndTomorrow } from "@/lib/meeting";
import {
  KIND_LABEL,
  matchesFilter,
  modifiedByPath,
  whenChanged,
  type RecentFilter,
} from "@/lib/startPage";
import { epicGroups, noteName, recentLeftOff } from "@/lib/taskLogic";
import { formatTime } from "@/lib/timeFormat";
import { useAiBlocked } from "@/lib/useAiBlocked";
import { cn, dirname, noteTitle } from "@/lib/utils";
import { useChatStore } from "@/stores/chatStore";
import { useIdeaStore } from "@/stores/ideaStore";
import { MAX_RECENT } from "@/stores/recentStore";
import { useMeetingStore } from "@/stores/meetingStore";
import { usePlanStore } from "@/stores/planStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { useExcerpt, usePinned, useRecentNotes } from "./useStartData";

const FILTERS: { id: RecentFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "note", label: "Pages" },
  { id: "meeting", label: "Meetings" },
  { id: "epic", label: "Epics" },
];

/** How many recent notes show before "Show more". */
const RECENT_SHOWN = 8;
const RECENT_SHOWN_NARROW = 5;

const ROW =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-1 text-sm text-muted-foreground">{children}</p>;
}

/** What is on today: the next meeting, what you work on and what waits, and where you left off. */
export function TodayWidget() {
  const { coming, now } = useComingMeetings();
  const format = useUiStore((s) => s.timeFormat);
  const tasks = useTaskStore((s) => s.tasks);
  const { notes, modified } = useRecentNotes();
  const timeFormat = useUiStore((s) => s.timeFormat);
  const today = todayAndTomorrow(now)[0];
  const meeting = coming.find((m) => m.meeting.date === today) ?? null;
  const open = tasks.filter((t) => !t.done);
  const doing = open.filter((t) => t.status === "doing");
  const waiting = open.filter((t) => t.status === "waiting");
  const last = notes[0] ?? null;
  if (meeting === null && doing.length === 0 && waiting.length === 0 && last === null) {
    return <Empty>Nothing planned today.</Empty>;
  }
  const taskRow = (t: (typeof open)[number]) => (
    <li key={`${t.path}:${String(t.line)}`}>
      <PlainButton
        type="button"
        className={ROW}
        onClick={() => {
          useTaskStore.getState().open(t);
        }}
      >
        <span aria-hidden className="size-3.5 shrink-0 rounded border border-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{t.title}</span>
        <StatusChip status={t.status} />
      </PlainButton>
    </li>
  );
  return (
    <div className="flex flex-col gap-2">
      {meeting !== null && (
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="w-16 shrink-0 whitespace-nowrap text-sm text-muted-foreground tabular-nums">
            {meeting.meeting.time === null ? "" : formatTime(meeting.meeting.time, format)}
          </span>
          <PlainButton
            title={`Open ${meeting.meeting.title}`}
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold"
            onClick={() => {
              void openFile(meeting.path);
            }}
          >
            {meeting.meeting.title}
          </PlainButton>
          <Button
            size="sm"
            aria-label={`Start ${meeting.meeting.title}`}
            onClick={() => {
              useUiStore.getState().setMeetingFocus(meeting.path);
            }}
          >
            Start
          </Button>
        </div>
      )}
      {(doing.length > 0 || waiting.length > 0) && (
        <ul>{[...doing, ...waiting].slice(0, 8).map(taskRow)}</ul>
      )}
      {last !== null && (
        <div className="flex items-center gap-2 border-t px-2 pt-2 text-sm">
          <span className="text-muted-foreground">You left off here:</span>
          <span className="min-w-0 flex-1 truncate font-semibold">{noteTitle(last)}</span>
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
            edited {whenChanged(modified.get(last) ?? 0, new Date(), timeFormat)}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void openFile(last);
            }}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}

/** The last note: its name, where it is, when it changed and its first lines. */
export function ContinueWidget() {
  const { notes, modified } = useRecentNotes();
  const timeFormat = useUiStore((s) => s.timeFormat);
  const last = notes[0] ?? null;
  const excerpt = useExcerpt(last);
  const tasks = useTaskStore((s) => s.tasks);
  const left = recentLeftOff(tasks);
  if (last === null) return <Empty>The page you work on will be here.</Empty>;
  return (
    <div className="flex items-center gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-lg font-bold">{noteTitle(last)}</p>
        <p className="text-xs text-muted-foreground">
          {[
            dirname(last) === "" ? null : dirname(last),
            `edited ${whenChanged(modified.get(last) ?? 0, new Date(), timeFormat)}`,
          ]
            .filter((x) => x !== null)
            .join(" · ")}
        </p>
        {excerpt !== "" && (
          <p className="line-clamp-2 pt-1 text-sm text-muted-foreground">{excerpt}</p>
        )}
        {left !== null && (
          <div
            role="note"
            aria-label="Where you left off"
            className="mt-1 flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-accent-foreground"
          >
            <div className="min-w-0 flex-1">
              <span className="section-label text-accent-foreground">Where you left off</span>
              <p className="truncate text-sm font-semibold">{left.text}</p>
              <p className="truncate text-xs">{left.task.title}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                useTaskStore.getState().open(left.task);
              }}
            >
              Open the task
            </Button>
          </div>
        )}
      </div>
      <Button
        onClick={() => {
          void openFile(last);
        }}
      >
        Open
      </Button>
    </div>
  );
}

/** The notes opened lately, without the last one (that is Continue), with filters. */
export function RecentWidget({ narrow }: { narrow: boolean }) {
  const { notes, modified, kindOf } = useRecentNotes();
  const timeFormat = useUiStore((s) => s.timeFormat);
  const [filter, setFilter] = useState<RecentFilter>("all");
  const [more, setMore] = useState(false);
  const list = notes.slice(1).filter((p) => matchesFilter(kindOf(p), filter));
  const limit = more ? MAX_RECENT : narrow ? RECENT_SHOWN_NARROW : RECENT_SHOWN;
  return (
    <div className="flex flex-col gap-0.5">
      {!narrow && (
        <div className="flex flex-wrap items-center gap-1 pb-1">
          {FILTERS.map((f) => (
            <PlainButton
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-ring",
                filter === f.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
              onClick={() => {
                setFilter(f.id);
              }}
            >
              {f.label}
            </PlainButton>
          ))}
        </div>
      )}
      {list.length === 0 && (
        <Empty>
          {notes.length <= 1 ? "The pages you open will be listed here." : "Nothing of that kind."}
        </Empty>
      )}
      <ul>
        {list.slice(0, limit).map((p) => (
          <li key={p}>
            <PlainButton
              type="button"
              title={p}
              className={ROW}
              onClick={() => {
                void openFile(p);
              }}
            >
              <span className="w-16 shrink-0 rounded-full bg-muted px-2 text-center text-[11px] font-semibold text-muted-foreground">
                {KIND_LABEL[kindOf(p)]}
              </span>
              <span className="min-w-0 flex-1 truncate">{noteTitle(p)}</span>
              {!narrow && dirname(p) !== "" && (
                <span className="max-w-32 truncate text-xs text-muted-foreground">
                  {dirname(p).split("/").pop()}
                </span>
              )}
              <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                {whenChanged(modified.get(p) ?? 0, new Date(), timeFormat)}
              </span>
            </PlainButton>
          </li>
        ))}
      </ul>
      {list.length > limit && (
        <PlainButton
          type="button"
          className="rounded-md px-2 py-1 text-left text-xs font-semibold text-primary hover:bg-muted"
          onClick={() => {
            setMore(true);
          }}
        >
          Show more
        </PlainButton>
      )}
    </div>
  );
}

/** The pages and the tasks that are pinned. */
export function PinnedWidget() {
  const { paths, unpin } = usePinned();
  const tasks = useTaskStore((s) => s.tasks);
  const pinnedTasks = tasks.filter((t) => t.pinned);
  return (
    <div className="flex flex-col gap-1.5">
      {pinnedTasks.map((t) => (
        <div
          key={`${t.path}:${t.title}`}
          className="group flex items-center rounded-md border hover:bg-muted"
        >
          <PlainButton
            type="button"
            title={`Task in ${noteName(t.path)}`}
            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              useTaskStore.getState().open(t);
            }}
          >
            <Star className="size-3.5 shrink-0 fill-primary text-primary" aria-hidden />
            <span className="truncate">{t.title}</span>
            <StatusChip status={t.status} />
          </PlainButton>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label={`Unpin ${t.title}`}
            onClick={() => {
              void useTaskStore.getState().setPinned(t, false);
            }}
          >
            <X />
          </Button>
        </div>
      ))}
      {paths.map((p) => (
        <div key={p} className="group flex items-center rounded-md border hover:bg-muted">
          <PlainButton
            type="button"
            title={p}
            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              void openFile(p);
            }}
          >
            <Star className="size-3.5 shrink-0 fill-primary text-primary" aria-hidden />
            <span className="truncate">{noteTitle(p)}</span>
          </PlainButton>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label={`Unpin ${noteTitle(p)}`}
            onClick={() => {
              unpin(p);
            }}
          >
            <X />
          </Button>
        </div>
      ))}
      <p className="rounded-md border border-dashed px-2 py-1.5 text-xs text-muted-foreground">
        Pin a page, an epic or a task: right-click it, or use its <b>···</b> menu.
      </p>
    </div>
  );
}

/** The write-it-down box (note, task or idea) on the page. */
export function CaptureWidget() {
  return (
    <CapturePicker
      onSaved={(what, open) => {
        useUiStore.getState().toast(`Saved ${what}.`, "success", { label: "Open", run: open });
      }}
    />
  );
}

/** A search box. Ask AI is there only when an AI is on. */
export function SearchWidget() {
  const [text, setText] = useState("");
  const blocked = useAiBlocked();
  const search = (): void => {
    useUiStore.getState().focusSearch(text.trim());
  };
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        search();
      }}
    >
      <Input
        aria-label="Search your pages, or ask"
        placeholder="Search pages, or ask your AI…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="outline">
          <Search /> Search
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={blocked !== null || text.trim() === ""}
          title={blocked ?? "Ask your AI about your pages"}
          onClick={() => {
            const ui = useUiStore.getState();
            ui.focusChat();
            void useChatStore.getState().send(text.trim());
            setText("");
          }}
        >
          Ask AI
        </Button>
        {blocked !== null && <span className="text-xs text-muted-foreground">{blocked}</span>}
      </div>
    </form>
  );
}

/** Today's and tomorrow's meetings that are still to come, each with a Start button. */
export function NextMeetingWidget() {
  const { coming, now } = useComingMeetings();
  const format = useUiStore((s) => s.timeFormat);
  if (coming.length === 0) return <Empty>No meetings today or tomorrow.</Empty>;
  const today = todayAndTomorrow(now)[0];
  const day = (m: PlannedMeeting): "Today" | "Tomorrow" =>
    m.meeting.date === today ? "Today" : "Tomorrow";
  return (
    <div className="flex flex-col gap-1">
      {(["Today", "Tomorrow"] as const).map((d) => {
        const list = coming.filter((m) => day(m) === d);
        if (list.length === 0) return null;
        return (
          <div key={d} className="flex flex-col">
            <h4 className="px-2 pb-0.5 pt-1 text-xs text-muted-foreground">{d}</h4>
            <ul>
              {list.map((m, i) => (
                <li
                  key={m.path}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
                >
                  <span className="w-16 shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
                    {m.meeting.time === null ? "" : formatTime(m.meeting.time, format)}
                  </span>
                  <PlainButton
                    title={`Open ${m.meeting.title}`}
                    className={cn(
                      "min-w-0 flex-1 truncate text-left text-sm",
                      d === "Today" && i === 0 && "font-semibold",
                    )}
                    onClick={() => {
                      void openFile(m.path);
                    }}
                  >
                    {m.meeting.title}
                  </PlainButton>
                  <Button
                    size="sm"
                    variant={d === "Today" && i === 0 ? "default" : "outline"}
                    aria-label={`Start ${m.meeting.title}`}
                    onClick={() => {
                      useUiStore.getState().setMeetingFocus(m.path);
                    }}
                  >
                    Start
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** The tasks you work on and the ones that wait. */
export function WorkingOnWidget() {
  const tasks = useTaskStore((s) => s.tasks);
  const shown = tasks.filter((t) => !t.done && (t.status === "doing" || t.status === "waiting"));
  if (shown.length === 0) return <Empty>You are not working on a task, and none waits.</Empty>;
  return (
    <ul>
      {shown.slice(0, 8).map((t) => (
        <li key={`${t.path}:${String(t.line)}`}>
          <PlainButton
            type="button"
            className={ROW}
            onClick={() => {
              useTaskStore.getState().open(t);
            }}
          >
            <span className="min-w-0 flex-1 truncate">{t.title}</span>
            <StatusChip status={t.status} />
          </PlainButton>
        </li>
      ))}
    </ul>
  );
}

/** Pages made from ideas and open ideas. */
export function InboxWidget() {
  const tree = useVaultStore((s) => s.tree);
  const folder = useVaultStore((s) => s.vault?.config.quickNotesFolder) ?? "";
  const ideas = useIdeaStore((s) => s.ideas);
  const quick = useMemo(() => {
    const m = modifiedByPath(tree);
    return [...m.entries()]
      .filter(([p]) => folder !== "" && p.startsWith(`${folder.replace(/\/+$/, "")}/`))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([p]) => p);
  }, [tree, folder]);
  const open = ideas.filter((i) => i.status === null).slice(0, 5);
  if (quick.length === 0 && open.length === 0) return <Empty>Nothing to sort.</Empty>;
  return (
    <ul>
      {quick.map((p) => (
        <li key={p}>
          <PlainButton
            type="button"
            className={ROW}
            onClick={() => {
              void openFile(p);
            }}
          >
            <span className="w-14 shrink-0 text-xs text-muted-foreground">Page</span>
            <span className="min-w-0 flex-1 truncate">{noteTitle(p)}</span>
          </PlainButton>
        </li>
      ))}
      {open.map((i) => (
        <li key={i.line}>
          <PlainButton
            type="button"
            className={ROW}
            onClick={() => {
              useUiStore.getState().openArea("ideas");
              useIdeaStore.getState().select(i.line);
            }}
          >
            <span className="w-14 shrink-0 text-xs text-muted-foreground">Idea</span>
            <span className="min-w-0 flex-1 truncate">{i.text}</span>
          </PlainButton>
        </li>
      ))}
    </ul>
  );
}

/** Four tiles: Tasks, Meetings, Notes and Ideas. */
export function AreasWidget() {
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const meetings = useMeetingStore((s) => s.meetings);
  const files = useVaultStore((s) => s.files);
  const ideas = useIdeaStore((s) => s.ideas);
  const tile = (label: string, text: string, run: () => void) => (
    <PlainButton
      key={label}
      type="button"
      className="flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      onClick={run}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{text}</span>
    </PlainButton>
  );
  const openTasks = tasks.filter((t) => !t.done && t.status !== "dropped").length;
  return (
    <div className="grid grid-cols-2 gap-2">
      {tile("Tasks", `${String(openTasks)} open in ${String(epics.length)} epics`, () => {
        useUiStore.getState().openArea("tasks");
      })}
      {tile("Meetings", `${String(meetings.length)} meetings`, () => {
        useUiStore.getState().openArea("meetings");
      })}
      {tile("Pages", `${String(files.filter((f) => /\.md$/i.test(f)).length)} pages`, () => {
        useUiStore.getState().setLeftTab("files");
        useUiStore.getState().setCenterView("notes");
      })}
      {tile("Ideas", `${String(ideas.filter((i) => i.status === null).length)} open`, () => {
        useUiStore.getState().openArea("ideas");
      })}
    </div>
  );
}

/** Notes changed since yesterday. */
export function ChangedWidget() {
  const tree = useVaultStore((s) => s.tree);
  const timeFormat = useUiStore((s) => s.timeFormat);
  const rows = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 1);
    from.setHours(0, 0, 0, 0);
    return [...modifiedByPath(tree).entries()]
      .filter(([p, ms]) => ms >= from.getTime() && !isManagedNote(p) && /\.md$/i.test(p))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [tree]);
  if (rows.length === 0) return <Empty>Nothing changed since yesterday.</Empty>;
  return (
    <ul>
      {rows.map(([p, ms]) => (
        <li key={p}>
          <PlainButton
            type="button"
            title={p}
            className={ROW}
            onClick={() => {
              void openFile(p);
            }}
          >
            <span className="min-w-0 flex-1 truncate">{noteTitle(p)}</span>
            <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
              {whenChanged(ms, new Date(), timeFormat)}
            </span>
          </PlainButton>
        </li>
      ))}
    </ul>
  );
}

/** The open epics and how far each has come. */
export function EpicsWidget() {
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const order = useTaskStore((s) => s.epicOrder);
  const groups = useMemo(
    () => epicGroups(tasks, epics, order).filter((g) => g.adopted && !g.allDone),
    [tasks, epics, order],
  );
  if (groups.length === 0) return <Empty>No open epics.</Empty>;
  return (
    <ul>
      {groups.slice(0, 8).map((g) => (
        <li key={g.path}>
          <PlainButton
            type="button"
            className={ROW}
            onClick={() => {
              useTaskStore.getState().openEpic(g.path);
            }}
          >
            <span className="min-w-0 flex-1 truncate">{g.title}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {g.done} of {g.total}
            </span>
          </PlainButton>
        </li>
      ))}
    </ul>
  );
}

/** The plans that are going (not archived): the name and how many parts each has. */
export function PlansWidget() {
  const plans = usePlanStore((s) => s.plans);
  const going = plans.filter((p) => !p.finished);
  if (going.length === 0) return <Empty>No plans yet. Make one under Projects.</Empty>;
  return (
    <ul>
      {going.slice(0, 8).map((p) => (
        <li key={p.path}>
          <PlainButton
            type="button"
            className={ROW}
            onClick={() => {
              void usePlanStore.getState().open(p.path);
            }}
          >
            <span className="min-w-0 flex-1 truncate">{p.title}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {p.ideas} {p.ideas === 1 ? "part" : "parts"}
            </span>
          </PlainButton>
        </li>
      ))}
    </ul>
  );
}

/** Loads what the widgets read once, when the page opens. */
export function useWidgetData(): void {
  useEffect(() => {
    void useMeetingStore.getState().load();
    void useTaskStore.getState().load();
    void useIdeaStore.getState().load();
    void usePlanStore.getState().load();
  }, []);
}
