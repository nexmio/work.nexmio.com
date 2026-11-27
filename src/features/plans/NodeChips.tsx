import { X } from "lucide-react";
import type { ReactNode } from "react";
import { PlainButton } from "@/components/ui/plain-button";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/stores/taskStore";
import { useVaultStore } from "@/stores/vaultStore";
import type { NodeInfo } from "./nodeInfo";
import { chipTitle } from "./place";
import { PlaceIcon } from "./PlaceIcon";

const CHIP =
  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs focus-visible:ring-2 focus-visible:ring-ring";

/** A chip with, when its link can be removed, a small cross after it. */
function Removable({
  children,
  label,
  onRemove,
}: {
  children: ReactNode;
  label: string;
  onRemove: (() => void) | undefined;
}) {
  if (onRemove === undefined) return children;
  return (
    <span className="inline-flex max-w-full items-center">
      {children}
      <PlainButton
        type="button"
        aria-label={label}
        title={`${label}. The page or task itself stays.`}
        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onRemove}
      >
        <X className="size-3.5" aria-hidden />
      </PlainButton>
    </span>
  );
}

/**
 * What a part is tied to: its epic (with progress), its pages and its task. Each opens that, and
 * shows with a house or an arrow whether it is in the plan's project.
 */
export function NodeChips({
  info,
  compact,
  onRemove,
}: {
  info: NodeInfo;
  compact?: boolean;
  /** Given where links can be removed: gets the links that put a chip there. */
  onRemove?: (links: readonly string[], what: string) => void;
}) {
  const { epic, notes, task, outside, written } = info;
  const remover = (links: readonly string[] | undefined, what: string) =>
    onRemove === undefined || links === undefined || links.length === 0
      ? undefined
      : () => {
          onRemove(links, what);
        };
  const name = (p: string): string => p.replace(/^.*\//, "").replace(/\.md$/i, "");
  // On the map and in the outline there is room for two chips beside each other only when tight.
  const chip = cn(CHIP, compact === true && "px-1.5");
  return (
    <>
      {epic && (
        <Removable
          label={`Remove the link to the epic ${epic.title}`}
          onRemove={remover(written.paths.get(epic.path), `the epic “${epic.title}”`)}
        >
          <PlainButton
            type="button"
            title={chipTitle(`Open the epic ${epic.title}`, epic.path, outside)}
            className={cn(chip, "bg-accent text-accent-foreground")}
            onClick={() => {
              useTaskStore.getState().openEpic(epic.path);
            }}
          >
            <PlaceIcon path={epic.path} outside={outside} />
            Epic · {epic.done} of {epic.total}
          </PlainButton>
        </Removable>
      )}
      {/* On the map and in the outline there is room for two; the panel shows them all. */}
      {(compact === true ? notes.slice(0, 2) : notes).map((p) => (
        <Removable
          key={p}
          label={`Remove the link to the page ${name(p)}`}
          onRemove={remover(written.paths.get(p), `the page “${name(p)}”`)}
        >
          <PlainButton
            type="button"
            title={chipTitle(`Open the page ${p}`, p, outside)}
            className={cn(chip, "max-w-40 bg-muted")}
            onClick={() => {
              void useVaultStore.getState().openNote(p);
            }}
          >
            <PlaceIcon path={p} outside={outside} />
            <span className="truncate">{compact === true ? "Page" : `Page · ${name(p)}`}</span>
          </PlainButton>
        </Removable>
      ))}
      {task && (
        <Removable
          label={`Remove the link to the task ${task.title}`}
          onRemove={remover(written.task, `the task “${task.title}”`)}
        >
          <PlainButton
            type="button"
            title={
              chipTitle("Open the task", task.path, outside) +
              (onRemove !== undefined && written.task.length === 0
                ? "\nIt shows because it has the same name as the part, so there is no link to remove."
                : "")
            }
            className={cn(
              chip,
              task.done
                ? "bg-success/15 text-success"
                : task.status === "waiting"
                  ? "bg-warning/25 text-foreground"
                  : "bg-muted text-muted-foreground",
            )}
            onClick={() => {
              useTaskStore.getState().open(task);
            }}
          >
            <PlaceIcon path={task.path} outside={outside} />
            Task{task.done ? " · done" : task.status === "waiting" ? " · waiting" : ""}
          </PlainButton>
        </Removable>
      )}
    </>
  );
}
