import { PlainButton } from "@/components/ui/plain-button";
import { cn } from "@/lib/utils";
import { useTaskStore } from "@/stores/taskStore";
import { useVaultStore } from "@/stores/vaultStore";
import type { NodeInfo } from "./nodeInfo";
import { chipTitle } from "./place";
import { PlaceIcon } from "./PlaceIcon";

const CHIP =
  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs focus-visible:ring-2 focus-visible:ring-ring";

/**
 * What a part is tied to: its epic (with progress), its pages and its task. Each opens that, and
 * shows with a house or an arrow whether it is in the plan's project.
 */
export function NodeChips({ info, compact }: { info: NodeInfo; compact?: boolean }) {
  const { epic, notes, task, outside } = info;
  // On the map and in the outline there is room for two chips beside each other only when tight.
  const chip = cn(CHIP, compact === true && "px-1.5");
  return (
    <>
      {epic && (
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
      )}
      {notes.slice(0, 2).map((p) => (
        <PlainButton
          key={p}
          type="button"
          title={chipTitle(`Open the page ${p}`, p, outside)}
          className={cn(chip, "max-w-40 bg-muted")}
          onClick={() => {
            void useVaultStore.getState().openNote(p);
          }}
        >
          <PlaceIcon path={p} outside={outside} />
          <span className="truncate">
            {compact === true ? "Page" : `Page · ${p.replace(/^.*\//, "").replace(/\.md$/i, "")}`}
          </span>
        </PlainButton>
      ))}
      {task && (
        <PlainButton
          type="button"
          title={chipTitle("Open the task", task.path, outside)}
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
      )}
    </>
  );
}
