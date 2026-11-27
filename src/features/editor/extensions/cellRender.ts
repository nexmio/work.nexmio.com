import { cellText } from "@/lib/markdownTable";

/** Inline Markdown shown in a table cell. The order matters: code first, so nothing inside it counts. */
const INLINE =
  /(`[^`]+`)|(\[\[[^\]]+\]\])|(\[[^\]]*\]\([^)\s]+\))|(\*\*[^*]+\*\*)|(~~[^~]+~~)|(\*[^*\s][^*]*\*|\b_[^_\s][^_]*_\b)/g;

function element(tag: string, className: string, text = ""): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

/** One line of text as nodes: bold, italic, strikethrough, code and links. Never as HTML. */
function inline(text: string): Node[] {
  const out: Node[] = [];
  let at = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > at) out.push(document.createTextNode(text.slice(at, m.index)));
    const all = m[0];
    if (m[1] !== undefined) out.push(element("code", "cm-inline-code", all.slice(1, -1)));
    else if (m[2] !== undefined) {
      const [target = "", alias] = all.slice(2, -2).split("|");
      const el = element("span", "cm-wikilink", alias ?? target);
      el.dataset.wikilink = target.split("#")[0] ?? target;
      out.push(el);
    } else if (m[3] !== undefined) {
      const split = all.indexOf("](");
      const el = element("span", "cm-link", all.slice(1, split));
      el.dataset.href = all.slice(split + 2, -1);
      out.push(el);
    } else if (m[4] !== undefined) out.push(element("strong", "cm-strong", all.slice(2, -2)));
    else if (m[5] !== undefined) out.push(element("span", "cm-strike", all.slice(2, -2)));
    else out.push(element("em", "cm-em", all.slice(1, -1)));
    at = m.index + all.length;
  }
  if (at < text.length) out.push(document.createTextNode(text.slice(at)));
  return out;
}

/** Shows a cell's source: a line each, and lines that start with `-` or `*` as a bullet list. */
export function renderCell(cell: HTMLElement, source: string): void {
  const lines = cellText(source).split("\n");
  cell.replaceChildren();
  let list: HTMLElement | null = null;
  for (const line of lines) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (list === null) {
        list = element("ul", "cm-cell-list");
        cell.append(list);
      }
      const item = element("li", "");
      item.append(...inline(bullet[1] ?? ""));
      list.append(item);
    } else {
      list = null;
      if (lines.length === 1) cell.append(...inline(line));
      else {
        const row = element("div", "cm-cell-line");
        row.append(...inline(line));
        if (line === "") row.append(document.createElement("br"));
        cell.append(row);
      }
    }
  }
}
