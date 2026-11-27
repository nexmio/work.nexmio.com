import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderKanban,
  History,
  LayoutList,
  Plus,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PanelHeader } from "@/components/PanelHeader";
import { PinMenuItem } from "@/components/PinMenuItem";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { PlainButton } from "@/components/ui/plain-button";
import {
  ALL_AREA,
  epicGroups,
  groupHasTag,
  LOOSE_AREA,
  pickArea,
  usedTags,
  type EpicGroup,
} from "@/lib/taskLogic";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { byProject } from "./byProject";
import { NewEpicDialog } from "./NewEpicDialog";

/** A thin bar: how far an epic has come. */
function Bar({ done, total }: { done: number; total: number }) {
  return (
    <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-muted">
      <span
        className="block h-full bg-primary"
        style={{ width: `${String(total === 0 ? 0 : (done / total) * 100)}%` }}
      />
    </span>
  );
}

/**
 * The left panel of the Tasks area: choose one epic and the middle shows only that. The epics of a
 * project stand under the project's name (`byProject`), the rest under "Other epics". The loose
 * tasks, from pages that are not epics, have a row of their own, and the finished epics are
 * folded away.
 */
export function TasksPanel() {
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const epicOrder = useTaskStore((s) => s.epicOrder);
  const chosen = useTaskStore((s) => s.chosenArea);
  const tag = useTaskStore((s) => s.tagFilter);
  const loaded = useTaskStore((s) => s.loaded);
  const centerView = useUiStore((s) => s.centerView);
  const vaultPath = useVaultStore((s) => s.vault?.path ?? null);
  const projects = useVaultStore((s) => s.projects);
  const [showDone, setShowDone] = useState(false);
  const [naming, setNaming] = useState(false);

  useEffect(() => {
    void useTaskStore.getState().load();
  }, []);
  useEffect(() => {
    useTaskStore.getState().restoreArea();
  }, [vaultPath]);

  const all = useMemo(() => epicGroups(tasks, epics, epicOrder), [tasks, epics, epicOrder]);
  const groups = all.filter((g) => g.adopted);
  const loose = all.filter((g) => !g.adopted);
  const looseCount = loose.reduce((n, g) => n + g.tasks.filter((t) => !t.done).length, 0);
  const current = pickArea(groups, loose.length > 0, chosen);
  const tags = useMemo(() => usedTags(tasks, epics), [tasks, epics]);
  // A tag that nothing has any more is not a filter any more.
  const activeTag = tag !== null && tags.includes(tag) ? tag : null;
  const open = groups.filter((g) => !g.allDone && groupHasTag(g, epics, activeTag));
  const done = groups.filter((g) => g.allDone && groupHasTag(g, epics, activeTag));
  const choose = (path: string): void => {
    useTaskStore.getState().chooseArea(path);
    useUiStore.getState().setCenterView("tasks");
  };
  const on = (path: string): boolean => centerView === "tasks" && current === path;

  const row = (g: EpicGroup) => (
    <li key={g.path}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <PlainButton
            type="button"
            aria-current={on(g.path)}
            className={cn(
              "flex w-full flex-col gap-1.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              on(g.path) && "bg-accent text-accent-foreground",
              g.allDone && "text-muted-foreground",
            )}
            onClick={() => {
              choose(g.path);
            }}
          >
            <span className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-medium">{g.title}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {g.done} of {g.total}
              </span>
            </span>
            <Bar done={g.done} total={g.total} />
            {g.tasks.some((t) => !t.done && t.status === "doing") && (
              <span className="text-xs text-muted-foreground">
                {g.tasks.filter((t) => !t.done && t.status === "doing").length} working on
              </span>
            )}
          </PlainButton>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onSelect={() => {
              useTaskStore.getState().openEpic(g.path);
            }}
          >
            <FileText className="size-4" aria-hidden /> Open the epic page
          </ContextMenuItem>
          <PinMenuItem path={g.path} kind="context" />
        </ContextMenuContent>
      </ContextMenu>
    </li>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title="Tasks">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setNaming(true);
          }}
        >
          <Plus /> New epic
        </Button>
      </PanelHeader>
      <NewEpicDialog
        open={naming}
        onClose={() => {
          setNaming(false);
        }}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-2 py-2">
        {tags.length > 0 && (
          <div className="flex flex-col gap-1 px-2 pb-3">
            <h3 className="section-label">Tags</h3>
            <ul aria-label="Show only a tag" className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <li key={t}>
                  <PlainButton
                    type="button"
                    aria-pressed={activeTag === t}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs focus-visible:ring-2 focus-visible:ring-ring",
                      activeTag === t
                        ? "border-primary bg-accent text-accent-foreground"
                        : "hover:bg-muted",
                    )}
                    onClick={() => {
                      useTaskStore.getState().setTagFilter(activeTag === t ? null : t);
                    }}
                  >
                    #{t}
                  </PlainButton>
                </li>
              ))}
            </ul>
          </div>
        )}
        <PlainButton
          type="button"
          aria-current={on(ALL_AREA)}
          className={cn(
            "mb-2 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
            on(ALL_AREA) && "bg-accent text-accent-foreground",
          )}
          onClick={() => {
            choose(ALL_AREA);
          }}
        >
          <LayoutList className="size-4" aria-hidden /> All epics
        </PlainButton>
        <h3 className="section-label px-2 pb-1">Choose an epic</h3>
        {loaded && open.length === 0 && loose.length === 0 && (
          <p className="px-2 text-xs text-muted-foreground">
            None yet. Make one with <b>New epic</b> above.
          </p>
        )}
        {byProject(open, projects).map((section) => (
          <div key={section.folder ?? ""} className="flex flex-col">
            {section.name !== null && (
              <span className="mt-2 flex items-center gap-1.5 px-2 pb-0.5 text-xs text-muted-foreground">
                <FolderKanban className="size-3.5" aria-hidden />
                Project · {section.name}
              </span>
            )}
            {section.name === null && section.others && (
              <span className="mt-2 px-2 pb-0.5 text-xs text-muted-foreground">Other epics</span>
            )}
            <ul
              aria-label={section.name === null ? "Other epics" : `Epics of ${section.name}`}
              className="flex flex-col gap-0.5"
            >
              {section.groups.map(row)}
            </ul>
          </div>
        ))}
        {loose.length > 0 && (
          <PlainButton
            type="button"
            aria-current={on(LOOSE_AREA)}
            className={cn(
              "mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              on(LOOSE_AREA) && "bg-accent text-accent-foreground",
            )}
            onClick={() => {
              choose(LOOSE_AREA);
            }}
          >
            <span className="min-w-0 flex-1 truncate font-medium">Loose tasks</span>
            <span className="text-xs tabular-nums text-muted-foreground">{looseCount}</span>
          </PlainButton>
        )}
        {done.length > 0 && (
          <>
            <PlainButton
              type="button"
              aria-expanded={showDone}
              className="mt-3 flex items-center gap-1 px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setShowDone(!showDone);
              }}
            >
              {showDone ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              Finished epics · {done.length}
            </PlainButton>
            {showDone && <ul className="flex flex-col gap-0.5">{done.map(row)}</ul>}
          </>
        )}
        <PlainButton
          type="button"
          aria-current={centerView === "time"}
          className={cn(
            "mt-3 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
            centerView === "time" && "bg-accent text-accent-foreground",
          )}
          onClick={() => {
            useUiStore.getState().setCenterView("time");
          }}
        >
          <Timer className="size-4" aria-hidden /> Time
        </PlainButton>
        <PlainButton
          type="button"
          aria-current={centerView === "lookback"}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
            centerView === "lookback" && "bg-accent text-accent-foreground",
          )}
          onClick={() => {
            useUiStore.getState().setCenterView("lookback");
          }}
        >
          <History className="size-4" aria-hidden /> Look back
        </PlainButton>
        <p className="mt-auto px-2 pt-4 text-xs leading-relaxed text-muted-foreground">
          All epics shows every epic in a row. Press one to see only that.
        </p>
      </div>
    </div>
  );
}
