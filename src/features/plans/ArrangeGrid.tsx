import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Arrange } from "./mapLayout";

/** "Put them in [3] columns / rows": any number, for a grid of the parts of a box. */
export function ArrangeGrid({
  now,
  count,
  onPick,
}: {
  /** How the parts stand now, if in a grid. */
  now: Arrange | undefined;
  /** How many parts the box has. */
  count: number;
  onPick: (a: Arrange) => void;
}) {
  const [n, setN] = useState(String(now && now.n > 1 ? now.n : 3));
  const value = Math.max(1, Math.min(Math.max(1, count), Math.round(Number(n)) || 1));
  const on = (by: Arrange["by"]): boolean => now?.by === by && now.n === value;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">
        Or a grid: write a number, then choose columns or rows. {count} parts.
      </span>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={1}
          max={Math.max(1, count)}
          aria-label="How many"
          className="w-16"
          value={n}
          onChange={(e) => {
            setN(e.target.value);
          }}
        />
        <Button
          size="sm"
          variant={on("cols") ? "default" : "outline"}
          aria-pressed={on("cols")}
          onClick={() => {
            onPick({ by: "cols", n: value });
          }}
        >
          Columns
        </Button>
        <Button
          size="sm"
          variant={on("rows") ? "default" : "outline"}
          aria-pressed={on("rows")}
          onClick={() => {
            onPick({ by: "rows", n: value });
          }}
        >
          Rows
        </Button>
      </div>
    </div>
  );
}
