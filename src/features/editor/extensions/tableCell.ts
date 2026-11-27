import { cellSource, cellText } from "@/lib/markdownTable";
import { renderCell } from "./cellRender";

/**
 * A cell of the table widget has two faces: shown (formatted) and edited (its text, with real new
 * lines). `data-source` holds the text as the file keeps it.
 */
export function makeCell(source: string, row: number, col: number): HTMLElement {
  const cell = document.createElement("div");
  cell.className = "cm-cell";
  cell.setAttribute("contenteditable", "plaintext-only");
  cell.dataset.row = String(row);
  cell.dataset.col = String(col);
  cell.dataset.source = source;
  renderCell(cell, source);
  return cell;
}

/** The text in a box that is being edited, whatever the browser made of its new lines. */
function typed(node: Node): string {
  let out = "";
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) out += child.textContent ?? "";
    else if (child.nodeName === "BR") out += "\n";
    else {
      if (child.nodeName === "DIV" && out !== "" && !out.endsWith("\n")) out += "\n";
      out += typed(child);
    }
  });
  return out;
}

/** The cell as the file would keep it now. */
export function readCell(cell: HTMLElement): string {
  return cell.dataset.editing === undefined ? (cell.dataset.source ?? "") : cellSource(typed(cell));
}

/** Shows the cell's text for editing. Does nothing (false) when it is being edited already. */
export function editCell(cell: HTMLElement): boolean {
  if (cell.dataset.editing !== undefined) return false;
  cell.dataset.editing = "";
  cell.textContent = cellText(cell.dataset.source ?? "");
  return true;
}

/** Takes what was typed and shows the cell formatted again. */
export function showCell(cell: HTMLElement): void {
  if (cell.dataset.editing === undefined) return;
  const source = readCell(cell);
  delete cell.dataset.editing;
  cell.dataset.source = source;
  renderCell(cell, source);
}

/** Puts the cursor after the last letter of a cell. */
export function caretToEnd(cell: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(cell);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

/** Types `text` at the cursor, as the browser would, so its own undo knows it. */
export function typeText(text: string): void {
  const doc = document as { execCommand?: (c: string, ui: boolean, v: string) => boolean };
  if (doc.execCommand?.call(document, "insertText", false, text) === true) return;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  selection.deleteFromDocument();
  selection.getRangeAt(0).insertNode(document.createTextNode(text));
  selection.collapseToEnd();
}

/** A new line at the cursor; in a bullet line, the next line starts with a bullet too. */
export function newLine(cell: HTMLElement): void {
  const selection = window.getSelection();
  let before = "";
  if (selection && selection.rangeCount > 0 && cell.contains(selection.anchorNode)) {
    const at = selection.getRangeAt(0);
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.setEnd(at.startContainer, at.startOffset);
    // Not `toString`: the browser may have made a new line as a `<br>`, which has no text.
    before = typed(range.cloneContents());
  }
  const line = before.slice(before.lastIndexOf("\n") + 1);
  const bullet = /^\s*([-*])\s+\S/.exec(line);
  typeText(bullet ? `\n${bullet[1] ?? "-"} ` : "\n");
}
