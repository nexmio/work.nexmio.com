/** The narrowest a column can be dragged, and the width a new column starts with (pixels). */
export const MIN_WIDTH = 48;
export const NEW_WIDTH = 160;

/** Gives the table these column widths, or lets the browser share the room when there are none. */
export function applyWidths(table: HTMLTableElement, widths: readonly number[] | null): void {
  table.querySelector("colgroup")?.remove();
  if (widths === null) {
    table.style.tableLayout = "";
    table.style.width = "";
    return;
  }
  const group = document.createElement("colgroup");
  for (const width of widths) {
    const col = document.createElement("col");
    col.style.width = `${String(width)}px`;
    group.append(col);
  }
  table.prepend(group);
  table.style.tableLayout = "fixed";
  table.style.width = `${String(widths.reduce((a, b) => a + b, 0))}px`;
}

/**
 * The widths after the edge to the right of `col` is moved `by` pixels. Between two columns one
 * gets what the other gives, so the table stays as wide; the last column's edge changes the table.
 */
export function moveEdge(widths: readonly number[], col: number, by: number): number[] {
  const own = widths[col] ?? MIN_WIDTH;
  const next = widths[col + 1];
  const least = Math.min(0, MIN_WIDTH - own);
  const most = next === undefined ? Infinity : Math.max(0, next - MIN_WIDTH);
  const d = Math.round(Math.min(most, Math.max(least, by)));
  return widths.map((w, i) => (i === col ? w + d : i === col + 1 ? w - d : w));
}

/**
 * Puts a handle on the right edge of every header cell: drag it to make the column wider or
 * narrower, double-click it to share the room by itself again. `save` gets the new widths, or
 * null for "by itself".
 */
export function addHandles(table: HTMLTableElement, save: (widths: number[] | null) => void): void {
  const heads = Array.from(table.querySelectorAll<HTMLElement>("thead th"));
  heads.forEach((th, col) => {
    const handle = document.createElement("span");
    handle.className = "cm-col-handle";
    handle.title = "Drag to change the width. Double-click for automatic widths.";
    handle.setAttribute("aria-hidden", "true");
    handle.addEventListener("dblclick", (e) => {
      e.preventDefault();
      applyWidths(table, null);
      save(null);
    });
    handle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const start = heads.map((h) => Math.max(MIN_WIDTH, Math.round(h.offsetWidth)));
      let widths = start;
      let moved = false;
      const move = (ev: PointerEvent): void => {
        widths = moveEdge(start, col, ev.clientX - e.clientX);
        moved = true;
        applyWidths(table, widths);
      };
      const up = (): void => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        if (moved) save(widths);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
    th.append(handle);
  });
}
