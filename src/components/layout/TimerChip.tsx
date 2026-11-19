import { useEffect, useState } from "react";
import { PlainButton } from "@/components/ui/plain-button";
import { clockText } from "@/lib/timeLog";
import { useTimerStore } from "@/stores/timerStore";
import { useUiStore } from "@/stores/uiStore";

/** The clock of a running timer in the status bar. A click shows the timer in the right panel. */
export function TimerChip() {
  const running = useTimerStore((s) => s.running);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (running === null) return;
    setNow(Date.now());
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [running]);
  if (running === null) return null;
  return (
    <PlainButton
      type="button"
      title="Show the timer"
      className="flex max-w-[22rem] items-center gap-1.5 truncate rounded-full bg-accent px-2.5 text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => {
        useUiStore.getState().setRightTab("timer");
      }}
    >
      <span aria-hidden className="text-success">
        ●
      </span>
      <span className="tabular-nums">{clockText(now - running.startedAt)}</span>
      <span className="truncate">{running.title}</span>
    </PlainButton>
  );
}
