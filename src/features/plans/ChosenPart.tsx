import { ChevronLeft, ChevronRight, CornerDownRight, CornerLeftUp, Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";
import { InlineEdit } from "@/components/RowActions";
import { Button } from "@/components/ui/button";
import { samePath, type PlanNode } from "@/lib/planTree";
import { cn } from "@/lib/utils";
import { ArrangeGrid } from "./ArrangeGrid";
import type { Arrange } from "./mapLayout";
import { NodeChips } from "./NodeChips";
import { PartNote } from "./PartNote";
import type { NodeInfo } from "./nodeInfo";
import { usePlanStore } from "@/stores/planStore";
import type { NodeAction } from "./planActions";

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

/** The short names of the long action labels ("Link or make a task…" is "Task…"). */
const LINKS: { id: string; label: string }[] = [
  { id: "task", label: "Task…" },
  { id: "link", label: "Page…" },
];

/**
 * The part that is chosen on the map, in the right panel: its words and ties, then what can be
 * done with it in groups (Note, Parts, Link to, Arrange the parts, Move), and at the bottom
 * Repeat and Delete. The actions are the ones of the right-click menu of the map (`actions`), so a
 * button here does what the same item does there. The words are changed here, in the panel.
 */
export function ChosenPart({
  info,
  node,
  path,
  actions,
  arrange,
  arrangedNow,
  onArrange,
  onRename,
  onNote,
  siblings,
  aiOff,
}: {
  info: NodeInfo;
  node: PlanNode;
  path: readonly number[];
  actions: readonly NodeAction[];
  arrange: readonly ArrangeOption[];
  arrangedNow: Arrange | undefined;
  onArrange: (how: Arrange | null) => void;
  onRename: (text: string) => void;
  onNote: (text: string) => void;
  /** How many parts stand next to it (with it), to know which moves can be made. */
  siblings: number;
  aiOff: string | null;
}) {
  const isRoot = path.length === 0;
  const [renaming, setRenaming] = useState(false);
  const act = (id: string) => actions.find((a) => a.id === id);
  const tied = info.epic !== null || info.notes.length > 0 || info.task !== null;
  const parts = act("parts");
  const sub = act("sub");
  const repeat = act("repeat");
  const del = act("delete");
  const noteAt = usePlanStore((st) => st.noteAt);
  const writingNote = samePath(noteAt, path);
  const at = path[path.length - 1] ?? 0;
  /** The moves, in words: the order among the parts next to it, and the level it is on. */
  const MOVES = [
    { id: "up", label: "Earlier", Icon: ChevronLeft, can: at > 0 },
    { id: "down", label: "Later", Icon: ChevronRight, can: at < siblings - 1 },
    { id: "in", label: "Under the one before", Icon: CornerDownRight, can: at > 0 },
    { id: "out", label: "One level up", Icon: CornerLeftUp, can: path.length > 1 },
  ];
  return (
    <div className="flex min-h-full flex-col gap-4 p-4 text-sm">
      {renaming && !isRoot ? (
        // Its own row: the edit field grows in width only, not down the panel.
        <div className="flex items-center">
          <InlineEdit
            key={path.join(".")}
            value={info.plain}
            label={`Words of ${info.plain}`}
            className="text-base font-semibold"
            onSave={(t) => {
              setRenaming(false);
              onRename(t);
            }}
            onCancel={() => {
              setRenaming(false);
            }}
          />
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-base font-semibold leading-snug">{info.plain}</h3>
          {!isRoot && (
            <Button
              size="sm"
              variant="ghost"
              title="Rename this part"
              onClick={() => {
                setRenaming(true);
              }}
            >
              <Pencil /> Rename
            </Button>
          )}
        </div>
      )}
      {tied ? (
        <div className="flex flex-wrap gap-1.5">
          <NodeChips info={info} />
        </div>
      ) : (
        <p className="text-muted-foreground">Not linked to anything yet</p>
      )}

      {!isRoot && (
        <Group title="Note">
          <PartNote
            key={`${path.join(".")}${writingNote ? "-writing" : ""}`}
            note={node.note ?? ""}
            startOpen={writingNote}
            onSave={onNote}
            onDone={() => {
              if (writingNote) usePlanStore.getState().setNoteAt(null);
            }}
          />
        </Group>
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
          <div className="grid grid-cols-2 gap-1.5">
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
          {/* Earlier and Later side by side; the two level moves on a row each (longer words). */}
          <div className="grid grid-cols-2 gap-1.5">
            {MOVES.map(({ id, label, Icon, can }) => {
              const a = act(id);
              return a === undefined ? null : (
                <Button
                  key={id}
                  size="sm"
                  variant="outline"
                  className={cn("justify-start", (id === "in" || id === "out") && "col-span-2")}
                  disabled={!can}
                  onClick={a.run}
                >
                  <Icon /> {label}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            <b>Earlier</b> and <b>Later</b> change the order of the parts next to it (left to right
            on the map, or top to bottom in a stack). <b>Under the one before</b> makes it a smaller
            part of the part just before it. <b>One level up</b> takes it out of the part it is in.
          </p>
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
