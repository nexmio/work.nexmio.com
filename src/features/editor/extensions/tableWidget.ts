import { EditorView, WidgetType } from "@codemirror/view";
import {
  deleteColumn,
  deleteRow,
  insertColumn,
  insertRow,
  parseTable,
  serializeTable,
  setAlign,
  widthsKey,
  type Align,
  type Table,
} from "@/lib/markdownTable";
import { previewConfig } from "./previewConfig";
import { caretToEnd, editCell, makeCell, newLine, readCell, showCell, typeText } from "./tableCell";
import { addHandles, applyWidths, NEW_WIDTH } from "./tableColumns";
import { tableAt } from "./tableRange";

interface CellPos {
  row: number;
  col: number;
}

/** Cell to focus after the next rebuild of the widget (set by a commit). */
let pendingFocus: CellPos | null = null;

/** Reads the table as the user sees it in the DOM. */
export function readTableFromDom(dom: HTMLElement, base: Table): Table {
  const headerCells = Array.from(dom.querySelectorAll<HTMLElement>("thead .cm-cell"));
  const header = headerCells.map(readCell);
  const rows = Array.from(dom.querySelectorAll("tbody tr")).map((tr) =>
    Array.from(tr.querySelectorAll<HTMLElement>(".cm-cell")).map(readCell),
  );
  return {
    header: header.length > 0 ? header : base.header,
    align: base.align,
    rows: rows.length > 0 ? rows.map((r) => r.slice(0, base.header.length)) : base.rows,
  };
}

/**
 * Writes an edited table back into the document, replacing the table at the widget's position.
 * Does nothing when the text would not change. Exported for tests.
 */
export function commitTable(
  view: EditorView,
  dom: HTMLElement,
  table: Table,
  focus?: CellPos,
): void {
  // A widget that was already replaced must not write its stale content back.
  if (!dom.isConnected) return;
  const range = tableAt(view.state, view.posAtDOM(dom));
  if (!range) return;
  const text = serializeTable(table);
  if (text === range.text) return;
  pendingFocus = focus ?? null;
  view.dispatch({ changes: { from: range.from, to: range.to, insert: text } });
}

/** Builds the table element for a parsed table (no event wiring). Exported for tests. */
export function buildTableElement(table: Table): HTMLTableElement {
  const el = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  table.header.forEach((text, col) => {
    const th = document.createElement("th");
    th.style.textAlign = alignToCss(table.align[col] ?? null);
    th.appendChild(makeCell(text, -1, col));
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  el.appendChild(thead);
  const tbody = document.createElement("tbody");
  table.rows.forEach((cells, row) => {
    const tr = document.createElement("tr");
    cells.forEach((text, col) => {
      const td = document.createElement("td");
      td.style.textAlign = alignToCss(table.align[col] ?? null);
      td.appendChild(makeCell(text, row, col));
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  el.appendChild(tbody);
  return el;
}

function alignToCss(a: Align): string {
  return a ?? "left";
}

/** The rendered table shown in place of Markdown when the cursor is outside it. */
export class TableWidget extends WidgetType {
  constructor(
    readonly source: string,
    /** The column widths kept for this table, or null when the browser shares the room. */
    readonly widths: readonly number[] | null = null,
  ) {
    super();
  }

  override eq(other: TableWidget): boolean {
    return other.source === this.source && String(other.widths) === String(this.widths);
  }

  override ignoreEvent(): boolean {
    return true;
  }

  override toDOM(view: EditorView): HTMLElement {
    const root = document.createElement("div");
    root.className = "cm-table-widget";
    const table = parseTable(this.source);
    if (!table) {
      const pre = document.createElement("pre");
      pre.textContent = this.source;
      root.appendChild(pre);
      return root;
    }

    let last: CellPos = { row: 0, col: 0 };
    const toolbar = document.createElement("div");
    toolbar.className = "cm-table-toolbar";
    const scroll = document.createElement("div");
    scroll.className = "cm-table-scroll";
    const el = buildTableElement(table);
    scroll.appendChild(el);

    const cfg = view.state.facet(previewConfig);
    const saver = cfg.saveTableWidths;
    let widths =
      this.widths !== null && this.widths.length === table.header.length ? [...this.widths] : null;
    applyWidths(el, widths);
    if (saver) {
      addHandles(el, (next) => {
        widths = next;
        saver(widthsKey(readTableFromDom(el, table)), next ?? []);
      });
    }
    // Writes the table, and keeps its widths when the header (which names it) changes.
    const write = (next: Table, focus?: CellPos, columns: number[] | null = widths): void => {
      const key = widthsKey(next);
      if (saver && columns !== null && (key !== widthsKey(table) || columns !== widths)) {
        saver(key, columns);
      }
      commitTable(view, root, next, focus);
    };

    // Applies a structural edit to the table as currently shown (edits typed but not yet
    // committed are included), then commits it.
    const edit = (fn: (t: Table, at: CellPos) => { table: Table; focus?: CellPos }): void => {
      const current = readTableFromDom(el, table);
      const result = fn(current, last);
      let columns = widths;
      const added = result.table.header.length - current.header.length;
      if (columns !== null && added !== 0) {
        const at = Math.max(0, last.col);
        columns = [...columns];
        if (added < 0) columns.splice(at, 1);
        else columns.splice(at, 0, NEW_WIDTH);
      }
      write(result.table, result.focus, columns);
    };

    const button = (label: string, title: string, run: () => void): HTMLButtonElement => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.title = title;
      b.setAttribute("aria-label", title);
      b.addEventListener("mousedown", (e) => {
        e.preventDefault(); // keep focus where it is
      });
      b.addEventListener("click", run);
      return b;
    };

    const actions: [string, string, () => void][] = [
      [
        "Row ↑",
        "Insert row above",
        () => {
          edit((t, at) => ({ table: insertRow(t, Math.max(at.row - 1, -1)) }));
        },
      ],
      [
        "Row ↓",
        "Insert row below",
        () => {
          edit((t, at) => ({ table: insertRow(t, at.row) }));
        },
      ],
      [
        "−Row",
        "Delete row",
        () => {
          edit((t, at) => ({ table: at.row < 0 ? t : deleteRow(t, at.row) }));
        },
      ],
      [
        "Col ←",
        "Insert column left",
        () => {
          edit((t, at) => ({ table: insertColumn(t, at.col - 1) }));
        },
      ],
      [
        "Col →",
        "Insert column right",
        () => {
          edit((t, at) => ({ table: insertColumn(t, at.col) }));
        },
      ],
      [
        "−Col",
        "Delete column",
        () => {
          edit((t, at) => ({ table: deleteColumn(t, at.col) }));
        },
      ],
      [
        "Left",
        "Align column left",
        () => {
          edit((t, at) => ({ table: setAlign(t, at.col, "left") }));
        },
      ],
      [
        "Center",
        "Align column center",
        () => {
          edit((t, at) => ({ table: setAlign(t, at.col, "center") }));
        },
      ],
      [
        "Right",
        "Align column right",
        () => {
          edit((t, at) => ({ table: setAlign(t, at.col, "right") }));
        },
      ],
      [
        "Markdown",
        "Edit as Markdown",
        () => {
          const range = tableAt(view.state, view.posAtDOM(root));
          if (range) view.dispatch({ selection: { anchor: range.from } });
          view.focus();
        },
      ],
    ];
    for (const [label, title, run] of actions) toolbar.appendChild(button(label, title, run));
    root.appendChild(toolbar);
    root.appendChild(scroll);

    // The text is shown before the browser places the cursor, so it lands where you clicked.
    el.addEventListener("mousedown", (e) => {
      const target = e.target as HTMLElement;
      const cell = target.closest<HTMLElement>(".cm-cell");
      if (!cell || e.button !== 0) return;
      const link = target.closest<HTMLElement>("[data-wikilink], [data-href]");
      if (link && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const wiki = link.dataset.wikilink;
        if (wiki !== undefined) cfg.openWikiLink(wiki, cfg.resolveLink(wiki));
        else cfg.openHref(link.dataset.href ?? "", cfg.notePath);
        return;
      }
      editCell(cell);
    });
    el.addEventListener("focusin", (e) => {
      const target = e.target as HTMLElement;
      if (target.dataset.col === undefined) return;
      last = { row: Number(target.dataset.row), col: Number(target.dataset.col) };
      if (editCell(target)) caretToEnd(target);
      view.requestMeasure();
    });
    el.addEventListener("focusout", (e) => {
      const next = e.relatedTarget as Node | null;
      showCell(e.target as HTMLElement);
      view.requestMeasure();
      if (next && root.contains(next)) return; // still inside the widget
      write(readTableFromDom(el, table));
    });
    el.addEventListener("keydown", (e) => {
      const target = e.target as HTMLElement;
      if (target.dataset.col === undefined) return;
      const row = Number(target.dataset.row);
      const col = Number(target.dataset.col);
      const cols = table.header.length;
      const bodyRows = table.rows.length;
      if (e.key === "Escape") {
        e.preventDefault();
        target.blur();
        view.focus();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        newLine(target);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (row + 1 < bodyRows) focusCell(el, row + 1, col);
        else target.blur();
      } else if (e.key === "Tab") {
        e.preventDefault();
        const forward = !e.shiftKey;
        let nextRow = row;
        let nextCol = col + (forward ? 1 : -1);
        if (nextCol >= cols) {
          nextCol = 0;
          nextRow = row + 1;
        } else if (nextCol < 0) {
          nextCol = cols - 1;
          nextRow = row - 1;
        }
        if (nextRow > bodyRows - 1 && forward) {
          // Tab in the last cell adds a row and moves into it.
          const current = readTableFromDom(el, table);
          write(insertRow(current, bodyRows - 1), { row: bodyRows, col: 0 });
          return;
        }
        if (nextRow < -1) return;
        focusCell(el, nextRow, nextCol);
      }
    });
    el.addEventListener("paste", (e) => {
      e.preventDefault();
      typeText((e.clipboardData?.getData("text/plain") ?? "").replace(/\r\n|\r/g, "\n"));
    });

    if (pendingFocus) {
      const focus = pendingFocus;
      pendingFocus = null;
      queueMicrotask(() => {
        if (root.isConnected) focusCell(el, focus.row, focus.col);
      });
    }
    return root;
  }
}

function focusCell(el: HTMLTableElement, row: number, col: number): void {
  const selector = `[data-row="${row}"][data-col="${col}"]`;
  const cell = el.querySelector<HTMLElement>(selector);
  cell?.focus();
}
