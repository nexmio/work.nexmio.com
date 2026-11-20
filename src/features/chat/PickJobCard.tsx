import { Check, Copy, FilePlus, Loader2, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AiMistakesNote } from "@/components/AiMistakesNote";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { copyText } from "@/lib/clipboard";
import { useAiJobStore, type PickJob } from "@/stores/aiJobStore";
import { reportError } from "@/stores/uiStore";
import { GoToButton } from "./GoToButton";

const STATUS: Record<PickJob["status"], string> = {
  queued: "Waiting",
  running: "Working…",
  ready: "Ready to look at",
  failed: "Could not finish",
};

/**
 * A job in the Queue whose answer is a list to tick (parts, steps, tasks): while it waits or
 * works it only shows that, and when it is ready you tick what to keep and press Add. Nothing is
 * written before.
 */
export function PickJobCard({ job }: { job: PickJob }) {
  const { spec, picks } = job;
  const [chosen, setChosen] = useState<ReadonlySet<number>>(new Set());
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    setChosen(new Set((picks?.items ?? []).map((_, i) => i)));
  }, [picks]);
  const store = useAiJobStore.getState;
  const busy = job.status === "queued" || job.status === "running";
  const flip = (i: number): void => {
    setChosen((c) => {
      const next = new Set(c);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  const [one, many] = spec.noun;
  const add = async (): Promise<void> => {
    if (picks === null) return;
    setAdding(true);
    await store().acceptPicks(
      job.id,
      picks.items.filter((_, i) => chosen.has(i)),
    );
    setAdding(false);
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
            {spec.where} · {STATUS[job.status]}
          </p>
        </div>
        {spec.goTo !== undefined && (
          <GoToButton
            label={job.label}
            onClick={() => {
              store().goTo(job.id);
            }}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-1.5"
          aria-label={busy ? `Cancel: ${job.label}` : `Remove: ${job.label}`}
          title={busy ? "Stop and take it out of the queue" : "Take it out of the queue"}
          onClick={() => {
            store().remove(job.id);
          }}
        >
          <X />
        </Button>
      </div>
      {job.status === "failed" && job.error !== null && (
        <p className="text-xs text-destructive">{job.error}</p>
      )}
      {job.status === "ready" && picks !== null && (
        <>
          {spec.text !== undefined && (
            <section aria-label={spec.text.title} className="flex flex-col gap-2 text-sm">
              {picks.points.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          )}
          {spec.text === undefined && picks.points.length > 0 && (
            <section aria-label="The main points">
              <h4 className="section-label pb-1">The main points</h4>
              <ul className="ml-4 flex list-disc flex-col gap-1 text-sm">
                {picks.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          )}
          {spec.text !== undefined && picks.items.length === 0 ? null : picks.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">The AI found no {many} to add.</p>
          ) : (
            <ul className="flex flex-col gap-1.5" aria-label={`Suggested ${many}`}>
              {picks.items.map((t, i) => (
                <li key={`${String(i)}-${t}`}>
                  {picks.groups
                    ?.filter((g) => g.from === i && g.to > g.from)
                    .map((g) => (
                      <h4 key={g.title} className="section-label pb-1 pt-1.5">
                        {g.title}
                      </h4>
                    ))}
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-md border px-2.5 py-1.5">
                    <Checkbox
                      className="mt-0.5"
                      checked={chosen.has(i)}
                      onChange={() => {
                        flip(i);
                      }}
                    />
                    <span className="text-sm">
                      {t}
                      {spec.firstIsStart === true && i === 0 && (
                        <span className="ml-2 rounded-full bg-accent px-2 text-xs text-accent-foreground">
                          Start here
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <AiMistakesNote />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                store().again(job.id);
              }}
            >
              <RotateCcw /> Try again
            </Button>
            {spec.other !== undefined && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (spec.other) store().again(job.id, spec.other.instruction);
                }}
              >
                {spec.other.label}
              </Button>
            )}
            {spec.copy !== undefined && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (spec.copy) void copyText(spec.copy(picks));
                }}
              >
                <Copy /> Copy
              </Button>
            )}
            {spec.text?.save !== undefined && (
              <Button
                size="sm"
                disabled={adding || picks.points.length === 0}
                onClick={() => {
                  const save = spec.text?.save;
                  if (save === undefined) return;
                  setAdding(true);
                  void save
                    .run(picks)
                    .then(() => {
                      store().remove(job.id);
                    })
                    .catch(reportError)
                    .finally(() => {
                      setAdding(false);
                    });
                }}
              >
                <FilePlus /> {spec.text.save.label}
              </Button>
            )}
            {picks.items.length > 0 && (
              <Button
                size="sm"
                disabled={adding || chosen.size === 0}
                onClick={() => {
                  void add();
                }}
              >
                <Check />{" "}
                {adding
                  ? "Adding…"
                  : `Add ${String(chosen.size)} ${chosen.size === 1 ? one : many}${spec.addTo}`}
              </Button>
            )}
          </div>
        </>
      )}
      {job.status === "failed" && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              store().again(job.id);
            }}
          >
            <RotateCcw /> Try again
          </Button>
        </div>
      )}
    </li>
  );
}
