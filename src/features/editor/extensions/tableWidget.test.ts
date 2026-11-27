import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { describe, expect, it, vi } from "vitest";
import { parseTable, serializeTable } from "@/lib/markdownTable";
import { insertTable } from "./commands";
import { defaultPreviewConfig, previewConfig, type PreviewConfig } from "./previewConfig";
import { caretToEnd, editCell, newLine, readCell } from "./tableCell";
import { buildTableElement, commitTable, readTableFromDom } from "./tableWidget";
import { tableAt, tableNodes } from "./tableRange";
import { livePreview } from "./livePreview";
import { must } from "@/test/must";

const doc = "intro\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\noutro";

function view(text: string, cursor = 0, config: Partial<PreviewConfig> = {}): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  return new EditorView({
    parent,
    state: EditorState.create({
      doc: text,
      selection: { anchor: cursor },
      extensions: [
        markdown({ base: markdownLanguage }),
        livePreview(),
        previewConfig.of({ ...defaultPreviewConfig, ...config }),
      ],
    }),
  });
}

describe("table ranges", () => {
  it("finds tables and the table at a position", () => {
    const state = EditorState.create({ doc, extensions: [markdown({ base: markdownLanguage })] });
    const [table] = tableNodes(state);
    expect(table?.text).toContain("| 1 | 2 |");
    expect(tableAt(state, doc.indexOf("| 1"))?.from).toBe(table?.from);
    expect(tableAt(state, 0)).toBeNull();
  });
});

describe("table widget DOM", () => {
  it("renders header and body cells as editable text, never as HTML", () => {
    const table = must(parseTable("| <b>x</b> | y |\n| --- | --- |\n| 1 | 2 |"));
    const el = buildTableElement(table);
    expect(el.querySelectorAll("th")).toHaveLength(2);
    expect(el.querySelector("th")?.textContent).toBe("<b>x</b>");
    expect(el.querySelector("th")?.querySelector("b")).toBeNull();
    expect(el.querySelector(".cm-cell")?.getAttribute("contenteditable")).toBe("plaintext-only");
  });

  it("reads edited cells back from the DOM", () => {
    const table = must(parseTable(doc.split("\n\n")[1] ?? ""));
    const el = buildTableElement(table);
    const cell = must(el.querySelector<HTMLElement>("td .cm-cell"));
    editCell(cell);
    cell.textContent = "changed";
    const back = readTableFromDom(el, table);
    expect(back.rows[0]).toEqual(["changed", "2"]);
    expect(serializeTable(back)).toContain("changed");
  });

  it("shows the table as a widget when the cursor is outside it", () => {
    const v = view(doc, 0);
    expect(v.dom.querySelector(".cm-table-widget")).not.toBeNull();
    expect(v.dom.querySelectorAll(".cm-table-widget td")).toHaveLength(2);
    v.destroy();
  });

  it("shows raw Markdown while the cursor is inside the table", () => {
    const v = view(doc, doc.indexOf("| 1"));
    expect(v.dom.querySelector(".cm-table-widget")).toBeNull();
    v.destroy();
  });

  it("commitTable writes the new text into the document and skips no-op edits", () => {
    const v = view(doc, 0);
    const widget = must(v.dom.querySelector<HTMLElement>(".cm-table-widget"));
    const table = must(parseTable("| a | b |\n| --- | --- |\n| 1 | 2 |"));
    commitTable(v, widget, table); // writes the aligned form of the same table
    const aligned = v.state.doc.toString();
    expect(aligned).toContain("| a   | b   |");
    commitTable(v, widget, table); // no change left: must not dispatch again
    expect(v.state.doc.toString()).toBe(aligned);
    // The widget was rebuilt by the edit above; a detached old element must be ignored.
    commitTable(v, widget, { ...table, rows: [["x", "2"]] });
    expect(v.state.doc.toString()).toBe(aligned);
    const fresh = must(v.dom.querySelector<HTMLElement>(".cm-table-widget"));
    commitTable(v, fresh, { ...table, rows: [["x", "2"]] });
    expect(v.state.doc.toString()).toContain("| x   | 2   |");
    v.destroy();
  });
});

describe("lines, lists and widths in a table", () => {
  const rich = "intro\n\n| a | b |\n| --- | --- |\n| - one<br>- **two** | [[Page\\|x]] |\n";
  const send = (cell: HTMLElement, type: "focusin" | "focusout"): void => {
    cell.dispatchEvent(new FocusEvent(type, { bubbles: true }));
  };

  it("shows lines that start with - as a list, with formatting and links", () => {
    const v = view(rich, 0);
    const cells = v.dom.querySelectorAll("td .cm-cell");
    expect(cells[0]?.querySelectorAll("li")).toHaveLength(2);
    expect(cells[0]?.querySelector("strong")?.textContent).toBe("two");
    expect(cells[1]?.querySelector("[data-wikilink='Page']")?.textContent).toBe("x");
    v.destroy();
  });

  it("shows the text while a cell is edited and keeps new lines when it is left", () => {
    const v = view(rich, 0);
    const cell = must(v.dom.querySelector<HTMLElement>("td .cm-cell"));
    send(cell, "focusin");
    expect(cell.textContent).toBe("- one\n- **two**");
    cell.textContent = "- one\n- three";
    send(cell, "focusout");
    expect(v.state.doc.toString()).toContain("- one<br>- three");
    v.destroy();
  });

  it("does not change a cell that was only looked at", () => {
    const v = view(rich, 0);
    const cell = must(v.dom.querySelector<HTMLElement>("td .cm-cell"));
    send(cell, "focusin");
    send(cell, "focusout");
    expect(v.state.doc.toString()).toContain("- one<br>- **two**");
    v.destroy();
  });

  it("gives the columns the widths that are kept, and keeps them when the header changes", () => {
    const save = vi.fn();
    const v = view(doc, 0, { tableWidths: () => [100, 200], saveTableWidths: save });
    const table = must(v.dom.querySelector("table"));
    expect(table.style.width).toBe("300px");
    expect(table.querySelectorAll("col")).toHaveLength(2);
    expect(table.querySelectorAll(".cm-col-handle")).toHaveLength(2);
    const head = must(v.dom.querySelector<HTMLElement>("th .cm-cell"));
    send(head, "focusin");
    head.textContent = "name";
    send(head, "focusout");
    expect(save).toHaveBeenCalledWith("name | b", [100, 200]);
    v.destroy();
  });

  it("starts the next line with a bullet, also after a line the browser made as <br>", () => {
    const v = view(rich, 0);
    const cell = must(v.dom.querySelector<HTMLElement>("td .cm-cell"));
    editCell(cell);
    cell.replaceChildren("Me", document.createElement("br"), "- first");
    document.body.appendChild(v.dom);
    caretToEnd(cell);
    newLine(cell);
    expect(readCell(cell)).toBe("Me<br>- first");
    expect(cell.textContent).toContain("\n- ");
    v.destroy();
  });

  it("has no handles where widths cannot be kept", () => {
    const v = view(doc, 0);
    expect(v.dom.querySelector(".cm-col-handle")).toBeNull();
    v.destroy();
  });
});

describe("insertTable", () => {
  it("inserts a parseable table on its own line", () => {
    const v = view("Hello world", 5);
    insertTable(v);
    const text = v.state.doc.toString();
    expect(text).toContain("Hello\n| Header 1");
    expect(parseTable(text.split("\n").slice(1, 4).join("\n"))).not.toBeNull();
    v.destroy();
  });
});
