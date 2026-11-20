import { splitText, type NodePath, type PlanNode } from "@/lib/planTree";

export const BOX_W = 176;
export const BOX_H = 58;
const COL_GAP = 20;
const ROW_GAP = 48;
/** The space between boxes that are stacked, and how far a stacked box is moved in. */
export const STACK_GAP = 14;
export const STACK_INDENT = 36;
/** Where the line of a stack runs, from the left edge of the box above. */
export const STACK_LINE = 16;
export const PAD = 24;

export interface Placed {
  path: NodePath;
  /** The words of this box and of those above it (links left out): what a choice about it is remembered by. */
  key: string;
  node: PlanNode;
  x: number;
  y: number;
  parent: Placed | null;
}

/**
 * How the parts under a box stand when they are not in one row: `cols` puts them in that many
 * columns (and as many rows as needed), `rows` in that many rows. One column is a stack.
 */
export interface Arrange {
  by: "cols" | "rows";
  n: number;
}

/** What is remembered about a map, per plan: how boxes arrange their parts, and boxes that were moved. */
export interface MapChoices {
  /** By the key of a box: how its parts stand (a box that is not here has them side by side in a row). */
  arranged: Record<string, Arrange>;
  /** How far a box was moved by hand (its parts follow it). */
  moved: Record<string, [number, number]>;
}

export const NO_CHOICES: MapChoices = { arranged: {}, moved: {} };

/**
 * The key of a box: the words of it and of everything above it (the plan itself is ""). The
 * `[[links]]` of a line are left out, so tying a part to a page or a task keeps its choices.
 */
export function keyOf(trail: readonly string[]): string {
  return trail.map((t) => splitText(t).plain).join("\u001f");
}

/** A key remembered before links were left out, made the way keys are made now. */
function cleanKey(key: string): string {
  return key === "" ? "" : keyOf(key.split("\u001f"));
}

/**
 * Places every part from the top down: the plan itself first (the box with the path `[]`). Parts
 * stand side by side in a row under their parent, which is in the middle above them. A box that is
 * arranged has its parts in a grid (one column is a stack) moved in under it, with a line down its
 * left side.
 */
export function layout(
  title: string,
  nodes: readonly PlanNode[],
  arranged: Readonly<Record<string, Arrange>>,
): { placed: Placed[]; width: number; height: number } {
  const placed: Placed[] = [];
  /** Moves what was placed from index `from` up to `to`. */
  const shift = (from: number, to: number, dx: number, dy: number): void => {
    for (let i = from; i < to; i++) {
      const p = placed[i];
      if (p) {
        p.x += dx;
        p.y += dy;
      }
    }
  };
  const visit = (
    node: PlanNode,
    path: NodePath,
    trail: string[],
    parent: Placed | null,
    ox: number,
    oy: number,
  ): { me: Placed; w: number; h: number } => {
    const me: Placed = { path, key: keyOf(trail), node, x: ox, y: oy, parent };
    placed.push(me);
    if (node.children.length === 0) return { me, w: BOX_W, h: BOX_H };
    const how = arranged[me.key];
    if (how) {
      const count = node.children.length;
      const n = Math.max(1, Math.min(count, Math.round(how.n)));
      const cols = how.by === "cols" ? n : Math.ceil(count / n);
      const rows = Math.ceil(count / cols);
      const cell = (i: number): { col: number; row: number } =>
        how.by === "cols"
          ? { col: i % cols, row: Math.floor(i / cols) }
          : { col: Math.floor(i / n), row: i % n };
      // Each part is placed on its own first, to know its size, and then moved to its cell.
      const parts = node.children.map((c, i) => {
        const start = placed.length;
        const r = visit(c, [...path, i], [...trail, c.text], me, 0, 0);
        return { start, end: placed.length, r, ...cell(i) };
      });
      const colW: number[] = Array.from({ length: cols }, () => 0);
      const rowH: number[] = Array.from({ length: rows }, () => 0);
      for (const q of parts) {
        colW[q.col] = Math.max(colW[q.col] ?? 0, q.r.w);
        rowH[q.row] = Math.max(rowH[q.row] ?? 0, q.r.h);
      }
      const colX = colW.map(
        (_, c) => ox + STACK_INDENT + colW.slice(0, c).reduce((a, b) => a + b + COL_GAP, 0),
      );
      const rowY = rowH.map(
        (_, r) => oy + BOX_H + STACK_GAP + rowH.slice(0, r).reduce((a, b) => a + b + STACK_GAP, 0),
      );
      for (const q of parts) shift(q.start, q.end, colX[q.col] ?? ox, rowY[q.row] ?? oy);
      const w = STACK_INDENT + colW.reduce((a, b) => a + b, 0) + COL_GAP * (cols - 1);
      const h = BOX_H + STACK_GAP + rowH.reduce((a, b) => a + b, 0) + STACK_GAP * (rows - 1);
      return { me, w: Math.max(BOX_W, w), h };
    }
    let x = ox;
    let h = 0;
    const kids = node.children.map((c, i) => {
      const r = visit(c, [...path, i], [...trail, c.text], me, x, oy + BOX_H + ROW_GAP);
      x += r.w + COL_GAP;
      h = Math.max(h, r.h);
      return r;
    });
    const first = kids[0];
    const last = kids[kids.length - 1];
    me.x = first && last ? (first.me.x + last.me.x) / 2 : ox;
    return { me, w: Math.max(BOX_W, x - COL_GAP - ox), h: BOX_H + ROW_GAP + h };
  };
  const top = visit({ text: title, children: [...nodes] }, [], [], null, PAD, PAD);
  return { placed, width: top.w + PAD * 2, height: top.h + PAD * 2 };
}

/** A box with its place after the boxes that were moved by hand are taken into account. */
export interface Shown extends Placed {
  parent: Shown | null;
  /** How far this box and the ones above it were moved. */
  dx: number;
  dy: number;
}

/** The places after moving: a box that was moved takes its parts with it. */
export function moveBoxes(
  placed: readonly Placed[],
  moved: Readonly<Record<string, [number, number]>>,
): { shown: Shown[]; width: number; height: number } {
  const byPath = new Map<Placed, Shown>();
  const shown: Shown[] = [];
  let width = 0;
  let height = 0;
  for (const p of placed) {
    const up = p.parent ? byPath.get(p.parent) : undefined;
    const own = moved[p.key] ?? [0, 0];
    const dx = (up?.dx ?? 0) + own[0];
    const dy = (up?.dy ?? 0) + own[1];
    const s: Shown = { ...p, parent: up ?? null, x: p.x + dx, y: p.y + dy, dx, dy };
    byPath.set(p, s);
    shown.push(s);
    width = Math.max(width, s.x + BOX_W + PAD);
    height = Math.max(height, s.y + BOX_H + PAD);
  }
  return { shown, width, height };
}

/** A thin upright bar between two heights (whichever is higher). */
function vbar(x: number, y1: number, y2: number): Bar {
  return { left: x, top: Math.min(y1, y2), width: 2, height: Math.max(2, Math.abs(y2 - y1)) };
}

/** A thin flat bar between two places along a line (whichever is further left). */
function hbar(y: number, x1: number, x2: number): Bar {
  return { left: Math.min(x1, x2), top: y, width: Math.abs(x2 - x1) + 2, height: 2 };
}

/**
 * The lines from a box to its parts: `{ left, top, width, height }` of each thin bar. They follow
 * the boxes wherever they were dragged, to the nearest side or the top.
 */
export function lines(child: Shown, arranged: Readonly<Record<string, Arrange>>): Bar[] {
  const parent = child.parent;
  if (parent === null) return [];
  const midY = child.y + BOX_H / 2;
  if (arranged[parent.key]) {
    const lx = parent.x + STACK_LINE;
    const bars = [vbar(lx, parent.y + BOX_H, midY)];
    // To the side of the part that faces the line (a part dragged to the left of it is met on its right).
    if (child.x + BOX_W < lx) bars.push(hbar(midY, lx, child.x + BOX_W));
    else if (child.x > lx) bars.push(hbar(midY, lx, child.x));
    return bars;
  }
  const pcx = parent.x + BOX_W / 2;
  const ccx = child.x + BOX_W / 2;
  const top = parent.y + BOX_H;
  const mid = (top + child.y) / 2;
  return [vbar(pcx, top, mid), hbar(mid, pcx, ccx), vbar(ccx, mid, child.y)];
}

export interface Bar {
  left: number;
  top: number;
  width: number;
  height: number;
}

// --- what is remembered (per computer) -----------------------------------------------------------

const STORE_KEY = "nexmio.planMap";

type All = Record<string, MapChoices>;

function readAll(): All {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const v: unknown = raw === null ? {} : JSON.parse(raw);
    return typeof v === "object" && v !== null ? (v as All) : {};
  } catch {
    return {};
  }
}

/** What was chosen for the map of a plan. */
/**
 * The choices after a box was renamed: what was remembered for the box at `from` and the boxes
 * under it is kept under the new key `to`.
 */
export function renameKey(choices: MapChoices, from: string, to: string): MapChoices {
  if (from === to || from === "") return choices;
  const move = <T>(rec: Record<string, T>): Record<string, T> =>
    Object.fromEntries(
      Object.entries(rec).map(([k, v]) => [
        k === from ? to : k.startsWith(`${from}\u001f`) ? to + k.slice(from.length) : k,
        v,
      ]),
    );
  return { arranged: move(choices.arranged), moved: move(choices.moved) };
}

export function readChoices(plan: string | null): MapChoices {
  if (plan === null) return NO_CHOICES;
  const c = readAll()[plan] as (Partial<MapChoices> & { stacked?: unknown }) | undefined;
  const arranged: Record<string, Arrange> = {};
  if (typeof c?.arranged === "object") {
    for (const [k, a] of Object.entries(c.arranged)) {
      const by: string = a.by;
      if ((by === "cols" || by === "rows") && Number.isFinite(a.n) && a.n >= 1) {
        arranged[cleanKey(k)] = { by, n: Math.round(a.n) };
      }
    }
  }
  // Before grids there was only "stacked": one column.
  if (Array.isArray(c?.stacked)) {
    for (const k of c.stacked) {
      if (typeof k === "string") arranged[cleanKey(k)] ??= { by: "cols", n: 1 };
    }
  }
  const moved: Record<string, [number, number]> = {};
  if (typeof c?.moved === "object") {
    for (const [k, v] of Object.entries(c.moved)) moved[cleanKey(k)] = v;
  }
  return { arranged, moved };
}

export function writeChoices(plan: string | null, choices: MapChoices): void {
  if (plan === null) return;
  try {
    const all = Object.entries(readAll()).filter(([k]) => k !== plan);
    const empty =
      Object.keys(choices.arranged).length === 0 && Object.keys(choices.moved).length === 0;
    if (!empty) all.push([plan, choices]);
    localStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(all)));
  } catch {
    /* the choice just is not remembered */
  }
}
