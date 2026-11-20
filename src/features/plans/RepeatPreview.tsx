import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** One box of the small drawing: a part, with a word under it ("Task") when it has one. */
function Box({
  text,
  tag,
  strong,
  faint,
}: {
  text: string;
  tag?: string;
  strong?: boolean;
  faint?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-col rounded-md border bg-card px-2 py-1 text-xs",
        strong && "border-primary font-semibold",
        faint && "border-dashed text-muted-foreground",
      )}
    >
      <span className="truncate">{text}</span>
      {tag !== undefined && (
        <span className="w-fit rounded-full bg-accent px-1.5 text-[10px] text-accent-foreground">
          {tag}
        </span>
      )}
    </span>
  );
}

/** A small tree: the part, and its parts under it with a line down the left. */
function Tree({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {head}
      <div className="ml-3 flex flex-col gap-1 border-l pl-3">{children}</div>
    </div>
  );
}

/** At most this many names are drawn; the rest is "and N more". */
const SHOWN = 2;

/**
 * What Repeat does, drawn with the real words: now, the part with its steps; after, the same part
 * with one smaller part for each name, each with the steps and a task. The steps move into the
 * names, unless one of them is tied to something (then they stay, and the names come after them).
 */
export function RepeatPreview({
  part,
  steps,
  names,
  keepSteps,
}: {
  part: string;
  steps: readonly string[];
  names: readonly string[];
  keepSteps: boolean;
}) {
  const shown = names.length > 0 ? names.slice(0, SHOWN) : ["(a name)", "(another name)"];
  const more = names.length - SHOWN;
  const stepBoxes = (faint: boolean) =>
    steps.map((s, i) => <Box key={`${String(i)}-${s}`} text={s} faint={faint} />);
  return (
    <figure
      aria-label="What Repeat does"
      className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 rounded-lg bg-muted/50 p-3"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="section-label">Now</span>
        <Tree head={<Box text={part} strong />}>{stepBoxes(false)}</Tree>
      </div>
      <ArrowRight className="mt-8 size-4 text-muted-foreground" aria-hidden />
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="section-label">After</span>
        <Tree head={<Box text={part} strong />}>
          {keepSteps && stepBoxes(true)}
          {shown.map((n, i) => (
            <Tree
              key={`${String(i)}-${n}`}
              head={<Box text={n} tag="Task" faint={names.length === 0} />}
            >
              {steps.slice(0, 2).map((s, j) => (
                <Box key={`${String(j)}-${s}`} text={s} />
              ))}
              {steps.length > 2 && (
                <span className="text-[10px] text-muted-foreground">+ {steps.length - 2} more</span>
              )}
            </Tree>
          ))}
          {more > 0 && <span className="text-xs text-muted-foreground">and {more} more</span>}
        </Tree>
      </div>
      <figcaption className="col-span-3 text-xs text-muted-foreground">
        {keepSteps
          ? `“${part}” stays, with its steps (one of them is tied to something, so they are kept). Each name becomes a part under it with the same steps, and a task in the plan's epic with them as its steps.`
          : `“${part}” stays as the heading. Each name becomes a part under it with the steps, and a task in the plan's epic with them as its steps. The steps move into the names, so they are not there twice.`}
      </figcaption>
    </figure>
  );
}
