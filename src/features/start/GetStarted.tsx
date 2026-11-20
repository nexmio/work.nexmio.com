import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { openNavArea } from "@/lib/actions";
import { safeStorage } from "@/lib/safeStorage";
import { cn } from "@/lib/utils";
import { useMeetingStore } from "@/stores/meetingStore";
import { usePlanStore } from "@/stores/planStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { startSteps, type StartStep } from "./startSteps";

/** Where "Close" is remembered: per vault, on this computer. */
const closedKey = (vault: string): string => `nexmio.getStarted.closed:${vault}`;

/** The place each step's button goes to, and its word. */
const GO: Record<StartStep["id"], { label: string; run: () => void }> = {
  plan: {
    label: "New project",
    run: () => {
      useUiStore.getState().requestNewPlan();
    },
  },
  parts: {
    label: "Open Projects",
    run: () => {
      openNavArea("plans");
    },
  },
  task: {
    label: "Open Projects",
    run: () => {
      openNavArea("plans");
    },
  },
  timer: {
    label: "Open Time",
    run: () => {
      useUiStore.getState().setCenterView("time");
    },
  },
  meeting: {
    label: "New meeting",
    run: () => {
      useUiStore.getState().setMeetingFormOpen(true);
    },
  },
};

/**
 * "Get started" on the start page: five small steps that show the idea of Nexmio Work (a plan, its
 * parts, a task, time, a meeting). Each ticks itself when the vault shows it is done; only the next
 * one has the main button. The card goes away when all five are done, and Close hides it for the
 * vault. Everything is read from what the start page's stores already hold.
 */
export function GetStarted() {
  const vault = useVaultStore((s) => s.vault?.path ?? "");
  const resolver = useVaultStore((s) => s.resolver);
  const plans = usePlanStore((s) => s.plans);
  const plansLoaded = usePlanStore((s) => s.loaded);
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const tasksLoaded = useTaskStore((s) => s.loaded);
  const meetings = useMeetingStore((s) => s.meetings.length);
  const [closed, setClosed] = useState(() => safeStorage.getItem(closedKey(vault)) === "1");

  const steps = useMemo(
    () =>
      startSteps({
        plans,
        tasks,
        epics,
        meetings,
        resolve: (t) => resolver.resolve(t),
      }),
    [plans, tasks, epics, meetings, resolver],
  );
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  // Shown only once the lists are read, so it does not flash on a vault that is far along.
  if (closed || next === undefined || !plansLoaded || !tasksLoaded) return null;

  return (
    <section
      aria-label="Get started"
      className="flex flex-col gap-3 rounded-xl border-2 border-primary bg-card p-5"
    >
      <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold">Get started</h3>
        <span className="rounded-full bg-accent px-2 text-xs text-accent-foreground">
          {done} of {steps.length}
        </span>
        <span className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            safeStorage.setItem(closedKey(vault), "1");
            setClosed(true);
          }}
        >
          Close
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Something big becomes a <b className="text-foreground">plan</b>. Its parts become{" "}
        <b className="text-foreground">tasks</b> in the plan&apos;s epic, and a task gets small{" "}
        <b className="text-foreground">steps</b>. Each step below ticks itself when it is done.
      </p>
      <ol className="flex flex-col gap-1">
        {steps.map((s) => {
          const isNext = s.id === next.id;
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                isNext && "bg-accent",
                s.done && "text-muted-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded border",
                  s.done ? "border-primary bg-primary text-primary-foreground" : "bg-card",
                )}
              >
                {s.done && <Check className="size-3.5" />}
              </span>
              <span className={cn("flex-1", isNext && "font-semibold")}>
                {s.label}
                <span className="sr-only">{s.done ? " (done)" : ""}</span>
              </span>
              {!s.done && (
                <Button size="sm" variant={isNext ? "default" : "outline"} onClick={GO[s.id].run}>
                  {GO[s.id].label}
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
