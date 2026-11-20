import type { EpicGroup } from "@/lib/taskLogic";
import { cn } from "@/lib/utils";

/** How far an epic has come: a thin bar and "2 of 4". */
export function EpicProgress({ group }: { group: EpicGroup }) {
  const pct = group.total === 0 ? 0 : (group.done / group.total) * 100;
  return (
    <>
      <span
        role="progressbar"
        aria-label={`${group.title} progress`}
        aria-valuemin={0}
        aria-valuemax={group.total}
        aria-valuenow={group.done}
        className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted @3xl/header:block"
      >
        <span
          className={cn("block h-full", group.allDone ? "bg-success" : "bg-primary")}
          style={{ width: `${String(pct)}%` }}
        />
      </span>
      <span className="whitespace-nowrap text-xs font-semibold tabular-nums">
        {group.done} of {group.total}
      </span>
    </>
  );
}
