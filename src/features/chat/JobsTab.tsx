import { Check, Copy, Loader2, X } from "lucide-react";
import { useState } from "react";
import { AiMistakesNote } from "@/components/AiMistakesNote";
import { DiagramPreview } from "@/components/DiagramPreview";
import { DiffView } from "@/components/DiffView";
import { Button } from "@/components/ui/button";
import { PlainButton } from "@/components/ui/plain-button";
import { missingFacts } from "@/lib/facts";
import { noteTitle } from "@/lib/utils";
import { useAiJobStore, type AiJob } from "@/stores/aiJobStore";

const STATUS: Record<AiJob["status"], string> = {
  queued: "Waiting",
  running: "Working…",
  ready: "Ready to look at",
  failed: "Could not finish",
};

function Job({ job }: { job: AiJob }) {
  const [showOld, setShowOld] = useState(false);
  const lost = job.status === "ready" && !job.answer ? missingFacts(job.text, job.result) : [];
  const remove = (): void => {
    useAiJobStore.getState().remove(job.id);
  };
  return (
    <li className="flex flex-col gap-2 rounded-lg border bg-card p-2.5">
      <div className="flex items-start gap-2">
        {job.status === "running" && (
          <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{job.label}</p>
          <p className="truncate text-xs text-muted-foreground">
            {noteTitle(job.notePath)} · {STATUS[job.status]}
          </p>
        </div>
        <PlainButton
          type="button"
          aria-label={
            job.status === "queued" || job.status === "running"
              ? `Cancel: ${job.label}`
              : `Remove: ${job.label}`
          }
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={remove}
        >
          <X className="size-3.5" aria-hidden />
        </PlainButton>
      </div>
      {job.status === "failed" && job.error !== null && (
        <p className="text-xs text-destructive">{job.error}</p>
      )}
      {job.status === "ready" && (
        <>
          <div className="max-h-72 overflow-auto rounded border">
            {job.diagram ? (
              <DiagramPreview source={job.result} />
            ) : job.answer ? (
              <p className="whitespace-pre-wrap p-2 text-sm">{job.result}</p>
            ) : showOld ? (
              <DiffView original={job.text} modified={job.result} />
            ) : (
              <p
                className="whitespace-pre-wrap p-2 text-sm"
                style={{ backgroundColor: "color-mix(in oklab, var(--success) 14%, transparent)" }}
              >
                {job.result}
              </p>
            )}
          </div>
          {lost.length > 0 && (
            <p role="status" className="text-xs text-foreground">
              Check: {lost.join(", ")} {lost.length === 1 ? "is" : "are"} gone
            </p>
          )}
          {!job.answer && !job.diagram && (
            <PlainButton
              type="button"
              aria-pressed={showOld}
              className="self-start rounded px-1 text-xs text-muted-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                setShowOld((v) => !v);
              }}
            >
              {showOld ? "Show only the new text" : "Show the original"}
            </PlainButton>
          )}
          <AiMistakesNote />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={remove}>
              <X /> {job.answer && !job.diagram ? "Close" : "Reject"}
            </Button>
            {job.answer && (
              <Button
                variant={job.diagram ? "outline" : "default"}
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(job.result).catch(() => undefined);
                }}
              >
                <Copy /> Copy
              </Button>
            )}
            {(!job.answer || job.diagram) && (
              <Button
                size="sm"
                onClick={() => {
                  void useAiJobStore.getState().accept(job.id);
                }}
              >
                <Check /> {job.diagram ? "Add under the text" : "Accept"}
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Accepting opens the page and writes it there. Your page is saved first, so it can be
            undone from History.
          </p>
        </>
      )}
    </li>
  );
}

/** The AI jobs: those that wait, the one that works and the answers to look at, one at a time. */
export function JobsTab() {
  const jobs = useAiJobStore((s) => s.jobs);
  return (
    <div className="min-h-0 flex-1 overflow-auto p-3" aria-live="polite">
      {jobs.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nothing is waiting. Choose an AI command on some text in a page: it is added here, the AI
          takes them one at a time, and you can work on another page meanwhile. When the answer is
          ready, accept it here and Nexmio Work writes it in the right page.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="AI tasks">
          {jobs.map((j) => (
            <Job key={j.id} job={j} />
          ))}
        </ul>
      )}
    </div>
  );
}
