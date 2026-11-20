import { shortDate } from "@/lib/taskLogic";
import type { TaskHistory } from "@/bindings/TaskHistory";

/** One line of the log: its date and text, with buttons to change or remove it. */
/** A line Nexmio Work wrote about the task (a status, what it waits for): shown with the log, not edited. */
export function HistoryItem({ entry, today }: { entry: TaskHistory; today: string }) {
  return (
    <li className="relative pb-4">
      <span
        aria-hidden
        className="absolute -left-[27px] top-1 size-2.5 rounded-full border-2 border-muted-foreground bg-card"
      />
      <span className="text-[11px] text-muted-foreground">
        {entry.date === today ? "Today" : shortDate(entry.date)}
      </span>
      <p className="text-sm text-muted-foreground">{entry.text}</p>
    </li>
  );
}
