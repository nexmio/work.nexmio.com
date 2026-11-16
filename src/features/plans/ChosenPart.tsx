import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pencil } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { PlanNode } from "@/lib/planTree";
import { cn } from "@/lib/utils";
import { ArrangeGrid } from "./ArrangeGrid";
import type { Arrange } from "./mapLayout";
import { NodeChips } from "./NodeChips";
import type { NodeInfo } from "./nodeInfo";
import { nodeActions } from "./planActions";

/** One way the parts of a box can stand, and whether it is in use. */
export interface ArrangeOption {
  label: string;
  on: boolean;
  run: () => void;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-1.5">
      <h4 className="section-label">{title}</h4>
      {children}
    </section>
  );
}

/** The short names of the long action labels ("Link or make an epic…" is "Epic…"). */
const LINKS: { id: string; label: string }[] = [
  { id: "epic", label: "Epic…" },
  { id: "task", label: "Task…" },
  { id: "link", label: "Note…" },
];

/**
 * The part that is chosen on the map, in the right panel: its words and ties, then what can be
 * done with it in four groups (Parts, Link to, Arrange the parts, Move), and at the bottom
 * Repeat and Delete. The actions are the same as in the right-click menu of the map.
 */
export function ChosenPart({
  info,
  node,
  path,
  arrange,
  arrangedNow,
  onArrange,
  onEdit,
  aiOff,
}: {
  info: NodeInfo;
  node: PlanNode;
  path: readonly number[];
  arrange: readonly ArrangeOption[];
  arrangedNow: Arrange | undefined;
  onArrange: (how: Arrange | null) => void;
  onEdit: () => void;
  aiOff: string | null;
}) {
  const isRoot = path.length === 0;
  const actions = nodeActions(path);
  const act = (id: string) => actions.find((a) => a.id === id);
  const tied = info.epic !== null || info.notes.length > 0 || info.task !== null;
  const parts = act("parts");
  const sub = act("sub");
  const repeat = act("repeat");
  const del = act("delete");
  const MOVES = [
    { id: "up", label: "Move up", Icon: ArrowUp },
    { id: "down", label: "Move down", Icon: ArrowDown },
    { id: "in", label: "One level in", Icon: ArrowRight },
    { id: "out", label: "One level out", Icon: ArrowLeft },
  ];
  return (
    <div className="flex min-h-full flex-col gap-4 p-4 text-sm">
      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug">{info.plain}</h3>
        {!isRoot && (
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label="Change the words"
            title="Change the words"
            onClick={onEdit}
          >
            <Pencil />
          </Button>
        )}
      </div>
      {tied ? (
        <div className="flex flex-wrap gap-1.5">
          <NodeChips info={info} />
        </div>
      ) : (
        <p className="text-muted-foreground">Not linked to anything yet</p>
      )}

      <Group title="Parts">
        <div className="grid grid-cols-2 gap-1.5">
          {parts !== undefined && (
            <Button
              size="sm"
              disabled={aiOff !== null}
              title={aiOff ?? undefined}
              onClick={parts.run}
            >
              Break it down…
            </Button>
          )}
          {sub !== undefined && (
            <Button size="sm" variant="outline" onClick={sub.run}>
              Add a part
            </Button>
          )}
        </div>
      </Group>

      {!isRoot && (
        <Group title="Link to">
          <div className="grid grid-cols-3 gap-1.5">
            {LINKS.map((l) => {
              const a = act(l.id);
              return a === undefined ? null : (
                <Button
                  key={l.id}
                  size="sm"
                  variant="outline"
                  aria-label={a.label}
                  title={a.label}
                  onClick={a.run}
                >
                  {l.label}
                </Button>
              );
            })}
          </div>
        </Group>
      )}

      {arrange.length > 0 && (
        <Group title="Arrange the parts">
          <div className="grid grid-cols-2 gap-1.5">
            {arrange.slice(0, 2).map((o) => (
              <Button
                key={o.label}
                size="sm"
                variant={o.on ? "default" : "outline"}
                aria-pressed={o.on}
                onClick={o.run}
              >
                {o.on ? "✓ " : ""}
                {o.label.replace(/^Parts (\w)/, (_, c: string) => c.toUpperCase())}
              </Button>
            ))}
          </div>
          <ArrangeGrid
            now={arrangedNow}
            count={node.children.length}
            onPick={(how) => {
              onArrange(how);
            }}
          />
        </Group>
      )}

      {!isRoot && (
        <Group title="Move">
          <div className="grid grid-cols-4 gap-1.5">
            {MOVES.map(({ id, label, Icon }) => {
              const a = act(id);
              return a === undefined ? null : (
                <Button
                  key={id}
                  size="sm"
                  variant="outline"
                  aria-label={label}
                  title={label}
                  onClick={a.run}
                >
                  <Icon />
                </Button>
              );
            })}
          </div>
        </Group>
      )}

      {!isRoot && (
        <div className="mt-auto flex items-center gap-1.5 pt-2">
          {repeat !== undefined && (
            <Button size="sm" variant="outline" className="flex-1" onClick={repeat.run}>
              {repeat.label}
            </Button>
          )}
          {del !== undefined && (
            <Button
              size="sm"
              variant="outline"
              className={cn("text-destructive hover:text-destructive")}
              onClick={del.run}
            >
              {del.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
