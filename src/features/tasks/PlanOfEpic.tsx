import { Network } from "lucide-react";
import { useEffect } from "react";
import { PlainButton } from "@/components/ui/plain-button";
import { noteName } from "@/lib/taskLogic";
import { usePlanIndex } from "@/stores/planIndexStore";
import { useUiStore } from "@/stores/uiStore";

/**
 * The line above an epic that was made for a plan: "Part of the plan “X”", with Open the plan.
 * It shows nothing for an epic that is not a plan's (its page came from somewhere else, or nowhere).
 */
export function PlanOfEpic({ from }: { from: string | null }) {
  const plans = usePlanIndex((s) => s.paths);
  const loaded = usePlanIndex((s) => s.loaded);
  useEffect(() => {
    if (!loaded) void usePlanIndex.getState().load();
  }, [loaded]);
  if (from === null || !plans.includes(from)) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
      <Network className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">
        Part of the plan <b>“{noteName(from)}”</b>
      </span>
      <PlainButton
        type="button"
        className="shrink-0 rounded px-1 font-semibold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => {
          useUiStore.getState().openPlan(from);
        }}
      >
        Open the plan
      </PlainButton>
    </div>
  );
}
