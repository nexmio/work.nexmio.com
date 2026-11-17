import { ChevronRight } from "lucide-react";
import { PlainButton } from "@/components/ui/plain-button";

/** One step of a trail: a place you can go to, or (without `run`) the place you are at. */
export interface TrailStep {
  label: string;
  run?: () => void;
}

/**
 * A small trail above a task, an epic or a plan that shows where it belongs, for example
 * "Office move › Plan › Tell the neighbours". Every step with a `run` takes you there. It shows
 * nothing when there is only one step, because then there is nothing to show.
 */
export function Trail({ steps }: { steps: readonly TrailStep[] }) {
  if (steps.length < 2) return null;
  return (
    <nav
      aria-label="Where this belongs"
      className="flex flex-wrap items-center gap-1 border-b px-5 py-1.5 text-xs text-muted-foreground"
    >
      {steps.map((s, i) => (
        <span key={`${String(i)}-${s.label}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight aria-hidden className="size-3" />}
          {s.run ? (
            <PlainButton type="button" className="text-primary hover:underline" onClick={s.run}>
              {s.label}
            </PlainButton>
          ) : (
            <span aria-current="page" className="text-foreground">
              {s.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
