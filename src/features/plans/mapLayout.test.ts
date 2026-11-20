import { beforeEach, describe, expect, it } from "vitest";
import type { PlanNode } from "@/lib/planTree";
import {
  BOX_H,
  BOX_W,
  STACK_INDENT,
  keyOf,
  layout,
  lines,
  moveBoxes,
  readChoices,
  renameKey,
  writeChoices,
} from "./mapLayout";

function must<T>(v: T | undefined): T {
  if (v === undefined) throw new Error("not found");
  return v;
}

const n = (text: string, ...children: PlanNode[]): PlanNode => ({ text, children });

describe("the map layout", () => {
  it("puts parts side by side, with the parent in the middle above them", () => {
    const { placed } = layout("Plan", [n("A", n("A1"), n("A2")), n("B")], {});
    const at = (t: string) => must(placed.find((p) => p.node.text === t));
    expect(at("A1").y).toBe(at("A2").y);
    expect(at("A2").x).toBeGreaterThan(at("A1").x + BOX_W - 1);
    expect(at("A").x).toBe((at("A1").x + at("A2").x) / 2);
    expect(at("A").y).toBeLessThan(at("A1").y);
  });

  it("keeps a stack when the part is tied to a page (its links are left out of the key)", () => {
    const stacked = { [keyOf(["Server"])]: { by: "cols" as const, n: 1 } };
    const tree = [n("Server [[Notes/Server]]", n("Disks"), n("Backup"))];
    const { placed } = layout("Plan", tree, stacked);
    const at = (t: string) => must(placed.find((p) => p.node.text === t));
    expect(at("Backup").x).toBe(at("Disks").x);
    expect(at("Backup").y).toBeGreaterThan(at("Disks").y);
  });

  it("stacks the parts of a box under each other, moved in", () => {
    const stacked = { [keyOf(["A"])]: { by: "cols" as const, n: 1 } };
    const { placed } = layout("Plan", [n("A", n("A1"), n("A2", n("A21")))], stacked);
    const at = (t: string) => must(placed.find((p) => p.node.text === t));
    expect(at("A1").x).toBe(at("A").x + STACK_INDENT);
    expect(at("A2").x).toBe(at("A1").x);
    expect(at("A2").y).toBeGreaterThanOrEqual(at("A1").y + BOX_H);
    expect(at("A21").y).toBeGreaterThan(at("A2").y);
  });

  it("does not let stacked boxes overlap", () => {
    const stacked = { [keyOf(["A"])]: { by: "cols" as const, n: 1 } };
    const { placed } = layout("Plan", [n("A", n("A1", n("X")), n("A2"))], stacked);
    const boxes = placed.map((p) => ({ x: p.x, y: p.y }));
    for (const a of boxes) {
      for (const b of boxes) {
        if (a === b) continue;
        const overlap = Math.abs(a.x - b.x) < BOX_W && Math.abs(a.y - b.y) < BOX_H;
        expect(overlap).toBe(false);
      }
    }
  });

  it("moves a box with its parts, and draws a line from the side for a stack", () => {
    const stacked = { [keyOf(["A"])]: { by: "cols" as const, n: 1 } };
    const { placed } = layout("Plan", [n("A", n("A1"))], stacked);
    const a = must(placed.find((p) => p.node.text === "A"));
    const { shown } = moveBoxes(placed, { [a.key]: [100, 40] });
    const sa = must(shown.find((p) => p.node.text === "A"));
    const s1 = must(shown.find((p) => p.node.text === "A1"));
    expect(sa.x).toBe(a.x + 100);
    expect(s1.x).toBe(must(placed.find((p) => p.node.text === "A1")).x + 100);
    const bars = lines(s1, stacked);
    expect(bars).toHaveLength(2);
    expect(bars[0]?.left).toBeLessThan(s1.x);
  });

  it("puts nine parts in a 3 by 3 grid, by columns or by rows, without overlap", () => {
    const kids = Array.from({ length: 9 }, (_, i) => n(`P${String(i)}`));
    for (const by of ["cols", "rows"] as const) {
      const { placed } = layout("Plan", [n("A", ...kids)], { [keyOf(["A"])]: { by, n: 3 } });
      const at = (t: string) => must(placed.find((p) => p.node.text === t));
      const xs = new Set(kids.map((k) => at(k.text).x));
      const ys = new Set(kids.map((k) => at(k.text).y));
      expect(xs.size).toBe(3);
      expect(ys.size).toBe(3);
      // By columns the order runs along a row; by rows it runs down a column.
      if (by === "cols") expect(at("P1").y).toBe(at("P0").y);
      else expect(at("P1").x).toBe(at("P0").x);
      const boxes = kids.map((k) => at(k.text));
      for (const a of boxes) {
        for (const b of boxes) {
          if (a !== b)
            expect(Math.abs(a.x - b.x) < BOX_W && Math.abs(a.y - b.y) < BOX_H).toBe(false);
        }
      }
    }
  });

  it("keeps a line to a part that was dragged to the other side of it", () => {
    const arranged = { [keyOf(["A"])]: { by: "cols" as const, n: 1 } };
    const { placed } = layout("Plan", [n("A", n("A1"))], arranged);
    const a = must(placed.find((p) => p.node.text === "A1"));
    const { shown } = moveBoxes(placed, { [a.key]: [-300, 0] });
    const bars = lines(must(shown.find((p) => p.node.text === "A1")), arranged);
    expect(bars).toHaveLength(2);
    expect(bars.every((b) => b.width >= 2 && b.height >= 2)).toBe(true);
  });

  it("remembers the choices for each plan", () => {
    localStorage.clear();
    const mine = {
      arranged: { A: { by: "rows" as const, n: 3 } },
      moved: { A: [3, 4] as [number, number] },
    };
    writeChoices("Plans/x.md", mine);
    expect(readChoices("Plans/x.md")).toEqual(mine);
    expect(readChoices("Plans/y.md").arranged).toEqual({});
    writeChoices("Plans/x.md", { arranged: {}, moved: {} });
    expect(readChoices("Plans/x.md").arranged).toEqual({});
    // A choice made before grids ("stacked") is read as one column.
    localStorage.setItem(
      "nexmio.planMap",
      JSON.stringify({ "Plans/z.md": { stacked: ["B"], moved: {} } }),
    );
    expect(readChoices("Plans/z.md").arranged).toEqual({ B: { by: "cols", n: 1 } });
    // A choice remembered with the links in its key is found by the words alone.
    localStorage.setItem(
      "nexmio.planMap",
      JSON.stringify({
        "Plans/w.md": {
          arranged: { "Server [[Notes/Server]]": { by: "cols", n: 1 } },
          moved: { "Server [[Notes/Server]]\u001fDisks": [5, 6] },
        },
      }),
    );
    expect(readChoices("Plans/w.md")).toEqual({
      arranged: { Server: { by: "cols", n: 1 } },
      moved: { "Server\u001fDisks": [5, 6] },
    });
  });
});

describe("renaming a box", () => {
  it("keeps what was remembered for it and the boxes under it", () => {
    const before = {
      arranged: { [keyOf(["A"])]: { by: "cols" as const, n: 1 }, B: { by: "rows" as const, n: 2 } },
      moved: { [keyOf(["A", "A1"])]: [1, 2] as [number, number] },
    };
    expect(renameKey(before, "A", "Alpha")).toEqual({
      arranged: { Alpha: { by: "cols", n: 1 }, B: { by: "rows", n: 2 } },
      moved: { [keyOf(["Alpha", "A1"])]: [1, 2] },
    });
  });
});

beforeEach(() => {
  localStorage.clear();
});
