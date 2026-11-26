import { MoreHorizontal } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ViewHeader } from "@/components/ViewHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlainButton } from "@/components/ui/plain-button";
import { nodeAt, PLANS_LABEL } from "@/lib/planTree";
import { cn } from "@/lib/utils";
import { askChat } from "@/lib/askChat";
import { AreaAiMenu } from "@/components/AreaAiMenu";
import { usePlanStore, type PlanView } from "@/stores/planStore";
import { suggestParts } from "./suggestParts";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { firstStep } from "./nodeInfo";
import { PlanDialogs } from "./PlanDialogs";
import { PlanMap } from "./PlanMap";
import { ProjectOverview } from "./ProjectOverview";
import { MigrateNotice } from "./MigrateNotice";
import { FOLDERS_VERSION } from "./migrate";
import { usePartSlot } from "./PartSlot";
import { PlanOutline } from "./PlanOutline";
import { PlanProjectNotice } from "./PlanProjectNotice";
import { usePlanContext } from "./usePlanContext";

const VIEWS: { id: PlanView; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "map", label: "Map" },
  { id: "outline", label: "Outline" },
];

/** A small drawing of a plan: a root, three parts, and what a part can be tied to. */
function ExamplePlan() {
  const box = "rounded-lg border bg-card px-3 py-2 text-center text-sm";
  return (
    <div aria-hidden className="flex w-full max-w-xl flex-col items-center">
      <div className={cn(box, "border-primary font-semibold")}>Move the office</div>
      <div className="h-4 w-px bg-input" />
      <div className="h-px w-2/3 bg-input" />
      <div className="grid w-full grid-cols-3 gap-3">
        {[
          ["Find a moving company", "Task"],
          ["IT and network", "Epic · 1 of 4"],
          ["Tell the customers", "2 parts"],
        ].map(([t, c]) => (
          <div key={t} className="flex flex-col items-center">
            <div className="h-3 w-px bg-input" />
            <div className={cn(box, "flex w-full flex-col gap-1")}>
              <span>{t}</span>
              <span className="mx-auto rounded-full bg-accent px-2 text-xs text-accent-foreground">
                {c}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The last "New plan" request from the navigation that was answered (it outlives this view). */
let handledNewPlan = 0;

/** The open plan in the middle: its parts as an outline or a map, and what to begin with. */
export function PlansView() {
  const path = usePlanStore((s) => s.path);
  const title = usePlanStore((s) => s.title);
  const finished = usePlanStore((s) => s.finished);
  const nodes = usePlanStore((s) => s.nodes);
  const view = usePlanStore((s) => s.view);
  const selected = usePlanStore((s) => s.selected);
  const chosenPart =
    selected === null || selected.length === 0 ? undefined : nodeAt(nodes, selected);
  const ctx = usePlanContext(path);
  const fromProject = useUiStore((s) => s.planFromProjectFolder);
  const planToOpen = useUiStore((s) => s.planToOpen);
  const newPlanNonce = useUiStore((s) => s.newPlanNonce);
  const slot = usePartSlot();

  // "New plan" in the navigation asks this area to open the choices.
  useEffect(() => {
    if (newPlanNonce === handledNewPlan) return;
    handledNewPlan = newPlanNonce;
    usePlanStore.getState().setGuidedOpen(true);
  }, [newPlanNonce]);

  // A plan that was asked for from outside this area (a project row in Files) is opened here.
  useEffect(() => {
    if (planToOpen === null) return;
    void usePlanStore.getState().open(planToOpen);
    useUiStore.getState().clearPlanToOpen();
  }, [planToOpen]);

  useEffect(() => {
    if (fromProject === null) return;
    usePlanStore.getState().setDialog({ kind: "import", folder: fromProject });
    useUiStore.getState().clearPlanFromProject();
  }, [fromProject]);

  useEffect(() => {
    if (!useTaskStore.getState().loaded) void useTaskStore.getState().load();
  }, []);

  if (path === null) {
    return (
      <section aria-label={PLANS_LABEL} className="flex h-full min-h-0 flex-col bg-background">
        <ViewHeader title={PLANS_LABEL}>
          <span className="hidden text-sm text-muted-foreground md:inline">
            Break something big down into parts
          </span>
        </ViewHeader>
        <div className="min-h-0 flex-1 overflow-auto px-6 py-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
            <p className="text-lg font-semibold">Start a project</p>
            <p className="max-w-lg text-center text-sm text-muted-foreground">
              A project is something big, broken down in its plan. Choose one at the left, or start
              one:
            </p>
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-xl border-2 border-primary bg-card p-4">
                <b>New project</b>
                <span className="text-sm text-muted-foreground">
                  A folder for it, and its plan: write the parts yourself, one at a time.
                </span>
                <Button
                  className="mt-1"
                  onClick={() => {
                    usePlanStore.getState().setGuidedOpen(true);
                  }}
                >
                  New project
                </Button>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                <b>A project you have</b>
                <span className="text-sm text-muted-foreground">
                  Make the plan of a project you already have.
                </span>
                <Button
                  className="mt-1"
                  variant="outline"
                  onClick={() => {
                    usePlanStore.getState().setDialog({ kind: "import", folder: null });
                  }}
                >
                  Make its plan…
                </Button>
              </div>
            </div>
            <p className="pt-2 text-sm text-muted-foreground">This is what a plan looks like:</p>
            <ExamplePlan />
          </div>
        </div>
        <PlanDialogs />
      </section>
    );
  }

  const start = firstStep(nodes, ctx);
  return (
    <section aria-label={PLANS_LABEL} className="flex h-full min-h-0 flex-col bg-background">
      <ViewHeader title={title}>
        <div
          role="group"
          aria-label="View"
          className="flex overflow-hidden rounded-md border text-sm"
        >
          {VIEWS.map((v, i) => (
            <PlainButton
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              className={cn(
                "px-3 py-1",
                i > 0 && "border-l",
                view === v.id ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-muted",
              )}
              onClick={() => {
                usePlanStore.getState().setView(v.id);
              }}
            >
              {v.label}
            </PlainButton>
          ))}
        </div>
        <AreaAiMenu
          label="AI for this project"
          groups={[
            {
              label: "Do",
              entries: [
                {
                  label: "Find what is missing",
                  hint: "Parts the plan may lack; you choose",
                  off: finished ? "The project is finished" : undefined,
                  run: () => {
                    suggestParts([]);
                  },
                },
                {
                  label: "Break down the chosen part",
                  hint: chosenPart === undefined ? "" : `Smaller parts of “${chosenPart.text}”`,
                  off: finished
                    ? "The project is finished"
                    : chosenPart === undefined
                      ? "Choose a part first"
                      : undefined,
                  run: () => {
                    if (selected !== null) suggestParts(selected);
                  },
                },
              ],
            },
            {
              label: "Ask",
              entries: [
                {
                  label: "Ask about this project",
                  hint: "How far it is, what is next",
                  run: () => {
                    void askChat(
                      `How far is the project “${title}” (plan ${path}), and what should I do next in it?`,
                    );
                  },
                },
              ],
            },
          ]}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" aria-label="More for this plan">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                usePlanStore.getState().setDialog({ kind: "migrate" });
              }}
            >
              Move to the new folder structure ({FOLDERS_VERSION})…
            </DropdownMenuItem>
            {finished ? (
              <>
                <DropdownMenuItem
                  onSelect={() => {
                    void usePlanStore.getState().setFinished(false);
                  }}
                >
                  Open it again
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => {
                    usePlanStore.getState().setDialog({ kind: "delete" });
                  }}
                >
                  Delete plan…
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                onSelect={() => {
                  usePlanStore.getState().setDialog({ kind: "finish" });
                }}
              >
                Archive plan…
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </ViewHeader>
      <PlanProjectNotice planPath={path} />
      <MigrateNotice />
      <div className="min-h-0 flex-1 overflow-auto">
        {finished && (
          <p className="mx-7 mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            This plan is archived. You can still read and change it, or open it again.
          </p>
        )}
        {view === "outline" ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-7 py-5">
            <p className="text-xs text-muted-foreground">
              Write down everything that comes to mind: Enter adds a part, Tab makes the next one a
              smaller part of it, Shift+Tab goes back up, and a pasted list becomes a tree. Nothing
              has to be tied to anything yet. When you want to, press ··· on a part to make it a
              task, an epic or a page, or to link one that is there. Double-click a part to rename
              it. There is no timer: take the time you need, or come back later.
            </p>
            <PlanOutline nodes={nodes} ctx={ctx} />
            {start && (
              <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <span className="section-label">A small place to start</span>
                  <p className="truncate text-sm font-semibold">{start.task.title}</p>
                  <p className="truncate text-xs text-muted-foreground">Under “{start.idea}”.</p>
                </div>
                <Button
                  onClick={() => {
                    useTaskStore.getState().open(start.task);
                  }}
                >
                  Open the task
                </Button>
              </div>
            )}
          </div>
        ) : view === "overview" ? (
          <ProjectOverview planPath={path} />
        ) : (
          <PlanMap nodes={nodes} ctx={ctx} />
        )}
      </div>
      {view === "outline" &&
        slot !== null &&
        createPortal(
          <p className="p-4 text-sm leading-relaxed text-muted-foreground">
            Open the map and choose a box to see what you can do with it. In the outline, every part
            has its own ··· menu.
          </p>,
          slot,
        )}
      <PlanDialogs />
    </section>
  );
}
