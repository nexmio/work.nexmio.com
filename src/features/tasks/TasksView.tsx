import { MoreHorizontal, Plus, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PromptDialog } from "@/components/PromptDialog";
import { ViewHeader } from "@/components/ViewHeader";
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
  areaLists,
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
import { focusEpic, firstOpenTask } from "./focusEpic";
import { NowCard } from "./NowCard";
import { TaskRow } from "./TaskRow";

export { EpicProgress } from "./EpicProgress";

/** "+ Add a task" at the bottom of an area: Enter adds it to that area's note. */
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
 * The task list, one area at a time: the chosen epic with the task to do Now, the ones After
 * that, the ones that wait for others, and the done ones folded away. Everything else about
 * an area (new, rename, delete, order, the note, the AI finder) is in its "⋯" menu.
 */
export function TasksView() {
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const epicOrder = useTaskStore((s) => s.epicOrder);
  const loaded = useTaskStore((s) => s.loaded);
  const chosen = useTaskStore((s) => s.chosenArea);
  const activePath = useVaultStore((s) => s.activePath);
  const vaultPath = useVaultStore((s) => s.vault?.path ?? null);
  const aiOff = useAiBlocked();
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
        <Button size="sm" variant="outline" aria-label="More for this area">
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
        {findTasks}
        {group !== null && at !== -1 && (
          <>
            <DropdownMenuItem
              disabled={at === 0}
              onSelect={() => {
                void useTaskStore.getState().moveEpic(group.path, true, movable);
              }}
            >
              Move this area up
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={at === movable.length - 1}
              onSelect={() => {
                void useTaskStore.getState().moveEpic(group.path, false, movable);
              }}
            >
              Move this area down
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

  const body = (g: EpicGroup) => {
    const lists = areaLists(g.tasks);
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        {lists.now !== null && <NowCard task={lists.now} others={lists.after} />}
        {lists.now === null && g.tasks.length > 0 && lists.waiting.length === 0 && (
          <p className="rounded-xl border bg-card p-4 text-base">
            Everything in this area is done.
          </p>
        )}
        {lists.after.length > 0 && (
          <section aria-label="After that" className="flex flex-col gap-1">
            <h3 className="section-label px-1">After that</h3>
            <ul className="rounded-xl border bg-card p-1">
              {lists.after.map((t, i, a) => (
                <TaskRow
                  key={`${t.path}:${String(t.line)}`}
                  task={t}
                  calm
                  showNote={false}
                  canMove={{ up: i > 0, down: i < a.length - 1 }}
                />
              ))}
            </ul>
          </section>
        )}
        {lists.waiting.length > 0 && (
          <section aria-label="Waiting for others" className="flex flex-col gap-1">
            <h3 className="section-label px-1">Waiting for others</h3>
            <ul className="rounded-xl border bg-card p-1">
              {lists.waiting.map((t) => (
                <TaskRow key={`${t.path}:${String(t.line)}`} task={t} calm showNote={false} />
              ))}
            </ul>
          </section>
        )}
        {lists.done.length > 0 && (
          <Fold label={`Done · ${String(lists.done.length)}`}>
            <ul className="rounded-xl border bg-card p-1">
              {lists.done.map((t) => (
                <TaskRow key={`${t.path}:${String(t.line)}`} task={t} calm showNote={false} />
              ))}
            </ul>
          </Fold>
        )}
        {g.tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">No tasks yet. Write the first one below.</p>
        )}
        <AddTask group={g} />
      </div>
    );
  };

  return (
    <section aria-label="Tasks" className="flex h-full min-h-0 flex-col bg-background">
      <ViewHeader title={group?.title ?? (isLoose ? "Loose tasks" : "Tasks")}>
        {group !== null && <EpicProgress group={group} />}
        {group !== null && firstOpenTask(group) !== undefined && (
          <Button
            size="sm"
            aria-label={`Start focus on ${group.title}`}
            onClick={() => {
              focusEpic(group);
            }}
          >
            <Target /> Start focus
          </Button>
        )}
        {menu}
      </ViewHeader>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        {!loaded && <p className="py-6 text-sm text-muted-foreground">Reading your pages…</p>}
        {loaded && group === null && !isLoose && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No epics yet.</p>
            <p>
              An epic is a page with tasks. Press <b>New epic</b> in the menu. Tasks you write in
              other pages are kept under <b>Loose tasks</b> until you make that page an epic.
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
                <ul className="rounded-xl border bg-card p-1">
                  {g.tasks.map((t) => (
                    <TaskRow key={`${t.path}:${String(t.line)}`} task={t} calm showNote={false} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
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
      <PromptDialog
        open={naming}
        title="New epic"
        label="Name"
        confirmLabel="Make it"
        initialValue=""
        validate={(v) => (v.trim() === "" ? "Enter a name" : null)}
        onCancel={() => {
          setNaming(false);
        }}
        onSubmit={(name) => {
          setNaming(false);
          void useTaskStore
            .getState()
            .createEpic(name, false)
            .then((path) => {
              if (path !== null) useTaskStore.getState().chooseArea(path);
            });
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
