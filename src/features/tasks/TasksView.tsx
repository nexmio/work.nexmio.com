import { MoreHorizontal, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PromptDialog } from "@/components/PromptDialog";
import { ViewHeader } from "@/components/ViewHeader";
import { AreaAiMenu } from "@/components/AreaAiMenu";
import { PinMenuItem } from "@/components/PinMenuItem";
import { breakDownTask } from "./breakDownTask";
import { askChat } from "@/lib/askChat";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InlineInput } from "@/components/ui/inline-input";
import { PlainButton } from "@/components/ui/plain-button";
import { openFile } from "@/lib/actions";
import {
  ALL_AREA,
  groupHasTag,
  statusGroups,
  tasksWithTag,
  epicGroups,
  LOOSE_AREA,
  noteName,
  pickArea,
  type EpicGroup,
} from "@/lib/taskLogic";
import { useAiBlocked } from "@/lib/useAiBlocked";
import { INBOX_PATH, useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { ChevronDown, ChevronRight } from "lucide-react";
import { EpicProgress } from "./EpicProgress";
import type { Task } from "@/bindings/Task";
import { EpicTags } from "./TaskTags";
import { NewEpicDialog } from "./NewEpicDialog";
import { EpicLanes, lanesOf, lanesOrder } from "./EpicLanes";
import { QuickLook } from "./QuickLook";
import { PlanOfEpic } from "./PlanOfEpic";
import { TaskRow } from "./TaskRow";

export { EpicProgress } from "./EpicProgress";

/** "+ Add a task" at the bottom of an epic: Enter adds it to that epic's page. */
function AddTask({ group }: { group: EpicGroup }) {
  const [text, setText] = useState("");
  return (
    <form
      className="pt-1"
      onSubmit={(e) => {
        e.preventDefault();
        const value = text.trim();
        if (value === "") return;
        setText("");
        void useTaskStore.getState().add(value, undefined, undefined, group.path);
      }}
    >
      <InlineInput
        aria-label={`Add a task to ${group.title}`}
        placeholder={`+ Add a task to ${group.title}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        className="w-full rounded-md border border-dashed border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:border-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  );
}

/** A folded line that opens a list: "Done · 3". */
function Fold({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <PlainButton
        type="button"
        aria-expanded={open}
        className="flex w-fit items-center gap-1 px-1 py-1 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => {
          setOpen(!open);
        }}
      >
        {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        {label}
      </PlainButton>
      {open && children}
    </div>
  );
}

/**
 * The task list. It opens on every epic in rows (`EpicLanes`); an epic shows its tasks as quiet
 * lines with a status dot, in the groups Working on, Next and Waiting, with the done ones folded
 * away. A task opens in the quick look over the list (`QuickLook`). Everything else about an
 * epic (new, rename, delete, order, its page) is in its "More" menu.
 */
export function TasksView() {
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const epicOrder = useTaskStore((s) => s.epicOrder);
  const loaded = useTaskStore((s) => s.loaded);
  const chosen = useTaskStore((s) => s.chosenArea);
  const tagFilter = useTaskStore((s) => s.tagFilter);
  const activePath = useVaultStore((s) => s.activePath);
  const vaultPath = useVaultStore((s) => s.vault?.path ?? null);
  const aiOff = useAiBlocked();
  const resolver = useVaultStore((s) => s.resolver);
  const [naming, setNaming] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState<EpicGroup | null>(null);

  useEffect(() => {
    void useTaskStore.getState().load();
  }, []);
  useEffect(() => {
    useTaskStore.getState().restoreArea();
  }, [vaultPath]);

  const all = useMemo(() => epicGroups(tasks, epics, epicOrder), [tasks, epics, epicOrder]);
  const groups = all.filter((g) => g.adopted);
  const loose = all.filter((g) => !g.adopted);
  const current = pickArea(groups, loose.length > 0, chosen);
  const group = groups.find((g) => g.path === current) ?? null;
  const isLoose = current === LOOSE_AREA;
  const isAll = current === ALL_AREA;
  const shown = group === null ? null : statusGroups(tasksWithTag(group, epics, tagFilter));
  /** What "break down" in the AI menu is about: the first task you work on, else the next. */
  const aiTask = shown === null ? null : (shown.working[0] ?? shown.next[0] ?? null);
  const lanes = lanesOf(
    groups.filter((g) => groupHasTag(g, epics, tagFilter)),
    loose.length === 0 ? null : { area: LOOSE_AREA, tasks: loose.flatMap((g) => g.tasks) },
    (g) => tasksWithTag(g, epics, tagFilter),
  );
  /** The tasks in the order the list shows them, for ↑ and ↓ in the quick look. */
  const order: Task[] = isAll
    ? lanesOrder(lanes)
    : shown !== null
      ? [...shown.working, ...shown.next, ...shown.waiting]
      : isLoose
        ? loose.flatMap((g) => g.tasks.filter((t) => !t.done))
        : [];
  const movable = groups.filter((g) => !g.allDone && g.path !== INBOX_PATH).map((g) => g.path);
  const at = group === null ? -1 : movable.indexOf(group.path);

  const findTasks = (
    <DropdownMenuItem
      disabled={activePath === null || aiOff !== null}
      title={
        aiOff ??
        (activePath === null
          ? "Open a page first, then the AI can look for tasks in it"
          : `Let the AI look for tasks in “${noteName(activePath)}”`)
      }
      onSelect={() => {
        useUiStore.getState().setFindTasksOpen(true);
      }}
    >
      Find tasks in a page
    </DropdownMenuItem>
  );

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" aria-label="More for this epic">
          <MoreHorizontal /> More
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem
          onSelect={() => {
            setNaming(true);
          }}
        >
          New epic…
        </DropdownMenuItem>
        {group !== null && group.native && (
          <DropdownMenuItem
            onSelect={() => {
              setRenaming(true);
            }}
          >
            Rename this epic…
          </DropdownMenuItem>
        )}
        {group !== null && (
          <DropdownMenuItem
            onSelect={() => {
              void openFile(group.path);
            }}
          >
            Open the page
          </DropdownMenuItem>
        )}
        {group !== null && (
          <DropdownMenuItem
            onSelect={() => {
              useTaskStore.getState().openEpic(group.path);
            }}
          >
            Open the epic page
          </DropdownMenuItem>
        )}
        {group !== null && group.adopted && <PinMenuItem path={group.path} kind="dropdown" />}
        {group === null && findTasks}
        {group !== null && at !== -1 && (
          <>
            <DropdownMenuItem
              disabled={at === 0}
              onSelect={() => {
                void useTaskStore.getState().moveEpic(group.path, true, movable);
              }}
            >
              Move this epic up
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={at === movable.length - 1}
              onSelect={() => {
                void useTaskStore.getState().moveEpic(group.path, false, movable);
              }}
            >
              Move this epic down
            </DropdownMenuItem>
          </>
        )}
        {group !== null && group.native && (
          <DropdownMenuItem
            onSelect={() => {
              setDeleting(group);
            }}
          >
            Delete this epic…
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const row = (t: Task, canMove?: { up: boolean; down: boolean }) => (
    <TaskRow
      key={`${t.path}:${String(t.line)}`}
      task={t}
      calm
      dot
      showNote={false}
      canMove={canMove}
      onOpen={(task) => {
        useTaskStore.getState().look({ path: task.path, line: task.line, title: task.title });
      }}
    />
  );

  const part = (label: string, list: readonly Task[], movable = false) =>
    list.length > 0 && (
      <section aria-label={label} className="flex flex-col gap-1">
        <h3 className="section-label px-1">{label}</h3>
        <ul className="rounded-xl border bg-card p-1">
          {list.map((t, i, a) =>
            row(t, movable ? { up: i > 0, down: i < a.length - 1 } : undefined),
          )}
        </ul>
      </section>
    );

  const body = (g: EpicGroup) => {
    const lists = statusGroups(tasksWithTag(g, epics, tagFilter));
    const open = lists.working.length + lists.next.length + lists.waiting.length;
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <PlanOfEpic from={g.source === null ? null : resolver.resolve(g.source)} />
        {open === 0 && g.tasks.length > 0 && (
          <p className="rounded-xl border bg-card p-4 text-base">
            Everything in this epic is done.
          </p>
        )}
        {part("Working on", lists.working)}
        {part("Next", lists.next, true)}
        {g.tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">No tasks yet. Write the first one below.</p>
        )}
        <AddTask group={g} />
        {part("Waiting", lists.waiting)}
        {lists.done.length > 0 && (
          <Fold label={`Done · ${String(lists.done.length)}`}>
            <ul className="rounded-xl border bg-card p-1">{lists.done.map((t) => row(t))}</ul>
          </Fold>
        )}
      </div>
    );
  };

  return (
    <section aria-label="Tasks" className="flex h-full min-h-0 flex-col bg-background">
      <ViewHeader
        title={group?.title ?? (isLoose ? "Loose tasks" : "All epics")}
        afterTitle={group?.adopted ? <EpicTags path={group.path} inline /> : undefined}
      >
        {group !== null && <EpicProgress group={group} />}
        {group !== null && (
          <AreaAiMenu
            label="AI for this epic"
            groups={[
              {
                label: "Do",
                entries: [
                  {
                    label: "Break down a task",
                    hint: aiTask === null ? "" : `Steps for “${aiTask.title}”`,
                    off: aiTask === null ? "There is no task to do" : undefined,
                    run: () => {
                      if (aiTask !== null) breakDownTask(aiTask);
                    },
                  },
                  {
                    label: "Find tasks in the open page",
                    hint: activePath === null ? "" : `The AI looks in “${noteName(activePath)}”`,
                    off: activePath === null ? "Open a page first" : undefined,
                    run: () => {
                      useUiStore.getState().setFindTasksOpen(true);
                    },
                  },
                ],
              },
              {
                label: "Ask",
                entries: [
                  {
                    label: "Ask about this epic",
                    hint: "What is next, what waits",
                    run: () => {
                      void askChat(
                        `In the epic “${group.title}” (${group.path}): what should I do next, and what is waiting?`,
                      );
                    },
                  },
                ],
              },
            ]}
          />
        )}
        {!isAll && menu}
      </ViewHeader>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        {!loaded && <p className="py-6 text-sm text-muted-foreground">Reading your pages…</p>}
        {loaded && isAll && groups.length > 0 && (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
            <EpicLanes
              lanes={lanes}
              tasks={tasks}
              onChoose={(area) => {
                useTaskStore.getState().chooseArea(area);
              }}
            />
            <p className="px-1 text-sm text-muted-foreground">
              Press a task to look at it, or its dot to change what it is. Press an epic's name to
              see all of it.
            </p>
          </div>
        )}
        {loaded && isAll && groups.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No epics yet.</p>
            <p>
              An epic is a page with tasks. Press <b>New epic</b>. Tasks you write in other pages
              are kept under <b>Loose tasks</b> until you make that page an epic.
            </p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => {
                setNaming(true);
              }}
            >
              <Plus /> New epic
            </Button>
          </div>
        )}
        {loaded && group !== null && body(group)}
        {loaded && isLoose && (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            <p className="text-sm text-muted-foreground">
              A page is an epic only when it has the tag <code>epic</code>. Press{" "}
              <b>Make an epic</b> to list one with your epics.
            </p>
            {loose.map((g) => (
              <section key={g.path} aria-label={g.title} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="section-label flex-1">{g.title}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    title="Gives the page the tag epic, so it is listed with your epics"
                    onClick={() => {
                      void useTaskStore.getState().adoptEpic(g.path);
                    }}
                  >
                    Make an epic
                  </Button>
                </div>
                <ul className="rounded-xl border bg-card p-1">{g.tasks.map((t) => row(t))}</ul>
              </section>
            ))}
          </div>
        )}
      </div>
      <QuickLook order={order} />
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete the epic “${deleting?.title ?? ""}”?`}
        description={`Its page and the ${String(deleting?.total ?? 0)} tasks in it are removed, but they stay in the version history, so they can be brought back.`}
        confirmLabel="Delete"
        destructive
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          const g = deleting;
          setDeleting(null);
          if (g === null) return;
          void useVaultStore
            .getState()
            .deletePath(g.path)
            .then(() => useTaskStore.getState().load());
        }}
      />
      <NewEpicDialog
        open={naming}
        onClose={() => {
          setNaming(false);
        }}
      />
      <PromptDialog
        open={renaming && group !== null}
        title="Rename this epic"
        label="Name"
        confirmLabel="Rename"
        initialValue={group?.title ?? ""}
        validate={(v) => (v.trim() === "" ? "Enter a name" : null)}
        onCancel={() => {
          setRenaming(false);
        }}
        onSubmit={(name) => {
          setRenaming(false);
          if (group !== null) void useTaskStore.getState().renameEpic(group.path, name);
        }}
      />
    </section>
  );
}
