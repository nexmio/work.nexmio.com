import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { PanelHeader } from "@/components/PanelHeader";
import { Button } from "@/components/ui/button";
import { PlainButton } from "@/components/ui/plain-button";
import { PLANS_LABEL } from "@/lib/planTree";
import { cn } from "@/lib/utils";
import { usePlanStore, type PlanSummary } from "@/stores/planStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { projectForPath, useVaultStore } from "@/stores/vaultStore";
import { planProgress, tasksOfPlan } from "./progress";

/**
 * The left panel of the Projects area: each project with how far its plan has come (tasks done
 * of all, from the plan's epic). A project without a plan has Make the plan. Plans that are in no
 * project (made before this was the rule) are listed apart, and the archived ones last.
 */
export function PlansPanel() {
  const plans = usePlanStore((s) => s.plans);
  const loaded = usePlanStore((s) => s.loaded);
  const current = usePlanStore((s) => s.path);
  const centerView = useUiStore((s) => s.centerView);
  const projects = useVaultStore((s) => s.projects);
  const resolver = useVaultStore((s) => s.resolver);
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);

  useEffect(() => {
    void usePlanStore.getState().load();
    if (!useTaskStore.getState().loaded) void useTaskStore.getState().load();
  }, []);

  const ongoing = plans.filter((p) => !p.finished);
  const finished = plans.filter((p) => p.finished);
  const inProject = (p: PlanSummary) => projectForPath(projects, p.path);
  const withoutProject = ongoing.filter((p) => inProject(p) === null);
  const progress = (p: PlanSummary) =>
    planProgress(tasksOfPlan(p.path, tasks, epics, (t) => resolver.resolve(t)));

  const row = (p: PlanSummary, name: string) => {
    const on = centerView === "plans" && current === p.path;
    const { done, total } = progress(p);
    return (
      <li key={p.path}>
        <PlainButton
          type="button"
          aria-current={on}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
            on && "bg-accent font-semibold text-accent-foreground",
            p.finished && "text-muted-foreground",
          )}
          onClick={() => {
            void usePlanStore.getState().open(p.path);
          }}
        >
          <span className="flex-1 truncate">{name}</span>
          <span
            className="text-xs font-normal text-muted-foreground tabular-nums"
            title={total === 0 ? "No tasks yet" : "Tasks done of all"}
          >
            {total === 0 ? "" : `${String(done)} of ${String(total)}`}
          </span>
        </PlainButton>
      </li>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title={PLANS_LABEL}>
        <Button
          size="sm"
          variant="ghost"
          aria-label="New project"
          title="A new project with its plan"
          onClick={() => {
            usePlanStore.getState().setGuidedOpen(true);
          }}
        >
          <Plus /> New
        </Button>
      </PanelHeader>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
            {(projects.length > 0 || withoutProject.length === 0) && (
              <h3 className="section-label px-2 pb-1">Ongoing</h3>
            )}
            {loaded && ongoing.length === 0 && projects.length === 0 && (
              <p className="px-2 text-xs text-muted-foreground">
                None yet. Press <b>New</b> to start a project and break it down.
              </p>
            )}
            <ul aria-label="Projects">
              {projects.map((pr) => {
                const own = ongoing.filter((p) => inProject(p)?.id === pr.id);
                if (own.length > 0) {
                  // A project with more than one plan lists each under the project's name.
                  return own.length === 1 && own[0] ? (
                    row(own[0], pr.name)
                  ) : (
                    <li key={pr.id}>
                      <span className="block px-2 pt-1 text-xs text-muted-foreground">
                        {pr.name}
                      </span>
                      <ul>{own.map((p) => row(p, p.title))}</ul>
                    </li>
                  );
                }
                if (plans.some((p) => inProject(p)?.id === pr.id)) return null;
                return (
                  <li key={pr.id} className="flex items-center gap-2 px-2 py-1 text-sm">
                    <span className="flex-1 truncate">{pr.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-primary"
                      aria-label={`Make the plan of ${pr.name}`}
                      onClick={() => {
                        useUiStore.getState().planFromProject(pr.folder);
                      }}
                    >
                      Make the plan
                    </Button>
                  </li>
                );
              })}
            </ul>
            {withoutProject.length > 0 && (
              <>
                <h3 className="section-label px-2 pb-1 pt-3">Plans in no project</h3>
                <ul>{withoutProject.map((p) => row(p, p.title))}</ul>
              </>
            )}
            {finished.length > 0 && (
              <>
                <h3 className="section-label px-2 pb-1 pt-3">Archived · {finished.length}</h3>
                <ul>{finished.map((p) => row(p, inProject(p)?.name ?? p.title))}</ul>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 w-full justify-start text-primary"
              onClick={() => {
                usePlanStore.getState().setGuidedOpen(true);
              }}
            >
              <Plus /> New project
            </Button>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onSelect={() => {
              usePlanStore.getState().setGuidedOpen(true);
            }}
          >
            New project…
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
