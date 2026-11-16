import {
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  Files,
  House,
  Lightbulb,
  ListChecks,
  Network,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type NavCounts, useNavCounts } from "@/lib/navCounts";
import { PLANS_LABEL } from "@/lib/planTree";
import { cn } from "@/lib/utils";
import { type CenterView, type LeftTab, useUiStore } from "@/stores/uiStore";

type Area = Exclude<LeftTab, "search">;

const TABS: { id: Area; label: string; Icon: typeof Files; count?: keyof NavCounts }[] = [
  { id: "files", label: "Pages", Icon: Files },
  { id: "tasks", label: "Tasks", Icon: ListChecks, count: "tasks" },
  { id: "plans", label: PLANS_LABEL, Icon: Network },
  { id: "meetings", label: "Meetings", Icon: CalendarClock, count: "meetings" },
  { id: "ideas", label: "Ideas", Icon: Lightbulb, count: "ideas" },
];

/** What the "New …" button at the top makes, by what fills the middle. */
export function newAction(view: CenterView): { label: string; run: () => void } {
  const ui = useUiStore.getState();
  switch (view) {
    case "notes":
      return { label: "New page", run: () => ui.openNewNoteDialog(null) };
    case "tasks":
    case "epic":
    case "task":
      return { label: "New task", run: () => ui.openCapture("task") };
    case "plans":
      return { label: "New plan", run: () => ui.requestNewPlan() };
    case "meetings":
      return { label: "New meeting", run: () => ui.setMeetingFormOpen(true) };
    case "ideas":
      return { label: "New idea", run: () => ui.openCapture("idea") };
    case "start":
      return { label: "New", run: () => ui.openCapture() };
  }
}

const ROW =
  "relative flex items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
const ON = "bg-accent font-semibold text-accent-foreground";

/** The name of an icon, shown at its right when the mouse rests on it or it has the focus. */
function Name({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover/icon:opacity-100"
    >
      {label}
    </span>
  );
}

/** The number at the right of a row, or a dot when the column is folded to icons. */
function Count({ n, folded }: { n: number | null; folded: boolean }) {
  if (n === null) return null;
  if (folded) {
    return (
      <span
        data-testid="nav-dot"
        aria-hidden
        className="absolute right-1 top-1 size-1.5 rounded-full bg-primary"
      />
    );
  }
  return (
    <span data-testid="nav-count" className="ml-auto text-xs tabular-nums opacity-85">
      {n}
    </span>
  );
}

/**
 * The navigation at the left edge: choose an area. It shows an icon and a name for each, and can
 * be folded to icons only. Pressing the open area again hides its list panel. The button at the
 * top makes a new thing of the kind the middle shows.
 */
export function ActivityRail() {
  const leftTab = useUiStore((s) => s.leftTab);
  const collapsed = useUiStore((s) => s.leftCollapsed);
  const center = useUiStore((s) => s.centerView);
  const folded = useUiStore((s) => s.navCollapsed);
  const counts = useNavCounts();
  const startOn = center === "start";
  const make = newAction(center);

  const choose = (id: Area): void => {
    const ui = useUiStore.getState();
    if (ui.leftTab === id && ui.centerView !== "start") {
      ui.toggleLeft();
      return;
    }
    if (id === "ideas" || id === "tasks" || id === "meetings" || id === "plans") ui.openArea(id);
    else {
      // Pages are about notes, so the note comes back in the middle.
      ui.setLeftTab(id);
      ui.setCenterView("notes");
    }
  };

  const text = (label: string): React.ReactNode =>
    folded ? null : <span className="truncate">{label}</span>;
  const size = folded ? "size-8 justify-center" : "h-8 gap-2.5 px-2.5";

  return (
    <nav
      aria-label="Navigation"
      className={cn(
        "flex shrink-0 flex-col gap-1 border-r bg-sidebar py-2",
        folded ? "w-11 items-center" : "w-40 px-2",
      )}
    >
      {folded ? (
        <div className="group/icon relative mb-1">
          <Button
            size="icon"
            aria-label={make.label}
            className="size-8"
            onClick={() => {
              make.run();
            }}
          >
            <Plus aria-hidden />
          </Button>
          <Name label={make.label} />
        </div>
      ) : (
        <Button
          size="sm"
          className="mb-1 w-full"
          onClick={() => {
            make.run();
          }}
        >
          <Plus aria-hidden /> {make.label}
        </Button>
      )}
      <div className="group/icon relative">
        <button
          type="button"
          aria-label="Start"
          aria-pressed={startOn}
          className={cn(ROW, size, "w-full", startOn && ON)}
          onClick={() => {
            useUiStore.getState().openStart();
          }}
        >
          <House className="size-4 shrink-0" aria-hidden />
          {text("Start")}
        </button>
        {folded && <Name label="Start page" />}
      </div>
      <div
        role="tablist"
        aria-label="Areas"
        aria-orientation="vertical"
        className={cn("flex flex-col gap-1", folded && "items-center")}
      >
        {TABS.map(({ id, label, Icon, count }) => {
          // Ideas open without their list panel, so the area in the middle marks the row too.
          const inMiddle = id === "ideas" && center === "ideas" && leftTab === "ideas";
          const on = !startOn && ((leftTab === id && !collapsed) || inMiddle);
          return (
            <div key={id} className="group/icon relative">
              <button
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={label}
                className={cn(ROW, size, !folded && "w-full", on && ON)}
                onClick={() => {
                  choose(id);
                }}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {text(label)}
                {count !== undefined && <Count n={counts[count]} folded={folded} />}
                {on && !folded && (
                  <span
                    aria-hidden
                    className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
              {folded && <Name label={label} />}
            </div>
          );
        })}
      </div>
      <span className="grow" />
      <div className="group/icon relative">
        <button
          type="button"
          aria-label="Settings"
          className={cn(ROW, size, !folded && "w-full")}
          onClick={() => {
            useUiStore.getState().setSettingsOpen(true);
          }}
        >
          <Settings className="size-4 shrink-0" aria-hidden />
          {text("Settings")}
        </button>
        {folded && <Name label="Settings" />}
      </div>
      <button
        type="button"
        aria-label={folded ? "Expand the navigation" : "Collapse the navigation"}
        aria-pressed={folded}
        className={cn(ROW, size, "text-xs", !folded && "w-full")}
        onClick={() => {
          useUiStore.getState().toggleNav();
        }}
      >
        {folded ? (
          <ChevronsRight className="size-4" aria-hidden />
        ) : (
          <>
            <ChevronsLeft className="size-4 shrink-0" aria-hidden />
            Collapse
          </>
        )}
      </button>
    </nav>
  );
}
