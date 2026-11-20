import { History } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { lookBack, weekOf } from "@/lib/lookBack";
import { todayIso } from "@/lib/taskLogic";
import { formatDuration } from "@/lib/timeLog";
import { useMeetingStore } from "@/stores/meetingStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";

/** "This week": how much was done, the time logged and the meetings so far, and Look back. */
export function WeekWidget() {
  const tasks = useTaskStore((s) => s.tasks);
  const epics = useTaskStore((s) => s.epics);
  const meetings = useMeetingStore((s) => s.meetings);
  const loaded = useMeetingStore((s) => s.loaded);
  useEffect(() => {
    if (!loaded) void useMeetingStore.getState().load();
  }, [loaded]);
  const week = useMemo(
    () =>
      lookBack({
        week: weekOf(0),
        today: todayIso(),
        tasks,
        epics,
        meetings,
        pages: [],
        project: null,
      }),
    [tasks, epics, meetings],
  );
  const facts = [
    `${String(week.done.length)} done`,
    week.minutes === 0 ? "no time logged" : formatDuration(week.minutes),
    `${String(week.meetings.length)} ${week.meetings.length === 1 ? "meeting" : "meetings"}`,
  ];
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-sm text-muted-foreground">{facts.join(" · ")}</p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          useUiStore.getState().setCenterView("lookback");
        }}
      >
        <History /> Look back
      </Button>
    </div>
  );
}
