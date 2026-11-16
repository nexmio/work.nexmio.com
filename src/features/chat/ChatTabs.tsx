import { PlainButton } from "@/components/ui/plain-button";
import { cn } from "@/lib/utils";
import { useAiJobStore } from "@/stores/aiJobStore";

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "tasks", label: "Queue" },
] as const;

/** The two parts of the AI tab: the chat, and the queue of AI jobs that wait or are ready. */
export function ChatTabs() {
  const tab = useAiJobStore((s) => s.tab);
  const jobs = useAiJobStore((s) => s.jobs);
  const ready = jobs.filter((j) => j.status === "ready" || j.status === "failed").length;
  return (
    <div role="group" aria-label="AI" className="flex shrink-0 border-b text-sm">
      {TABS.map((t) => (
        <PlainButton
          key={t.id}
          type="button"
          aria-pressed={tab === t.id}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 focus-visible:ring-2 focus-visible:ring-ring",
            tab === t.id
              ? "border-b-2 border-primary font-semibold"
              : "text-muted-foreground hover:bg-muted",
          )}
          onClick={() => {
            useAiJobStore.getState().setTab(t.id);
          }}
        >
          {t.label}
          {t.id === "tasks" && jobs.length > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                ready > 0 ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
              aria-label={`${String(jobs.length)} in the queue, ${String(ready)} ready`}
            >
              {jobs.length}
            </span>
          )}
        </PlainButton>
      ))}
    </div>
  );
}
