import { must } from "@/test/must";
import { describe, expect, it } from "vitest";
import {
  deleteColumn,
  deleteRow,
  emptyTable,
  cellSource,
  cellText,
  escapeCell,
  insertColumn,
  insertRow,
  parseTable,
  serializeTable,
  setAlign,
  setCell,
  splitRow,
} from "./markdownTable";

const simple = "| a | b |\n| --- | --- |\n| 1 | 2 |";

describe("parseTable", () => {
  it("parses a simple table", () => {
    expect(parseTable(simple)).toEqual({
      header: ["a", "b"],
      align: [null, null],
      rows: [["1", "2"]],
    });
  });
  it("reads alignment from the delimiter row", () => {
    const t = parseTable("a | b | c\n:-- | :-: | --:\n1 | 2 | 3");
    expect(t?.align).toEqual(["left", "center", "right"]);
  });
  it("keeps escaped pipes inside cells", () => {
    expect(parseTable("| a \\| b | c |\n| --- | --- |")?.header).toEqual(["a | b", "c"]);
  });
  it.each(["a|b", "a\\|b", "a\\\\|b", "C:\\temp\\new", "ends with \\", "\\* not a list"])(
    "gives back the cell %s unchanged, also after saving again",
    (text) => {
      const table = { header: [text, "x"], align: [null, null], rows: [[text, "y"]] };
      const once = serializeTable(table);
      const read = must(parseTable(once));
      expect(read.header).toEqual([text, "x"]);
      expect(read.rows).toEqual([[text, "y"]]);
      expect(serializeTable(read)).toBe(once);
    },
  );
  it("reads two backslashes before a pipe as older versions wrote them", () => {
    expect(splitRow("| a\\\\|b |")).toEqual(["a\\|b"]);
  });
  it("pads or cuts ragged rows to the header width", () => {
    const t = parseTable("| a | b |\n| - | - |\n| 1 |\n| 1 | 2 | 3 |");
    expect(t?.rows).toEqual([
      ["1", ""],
      ["1", "2"],
    ]);
  });
  it("returns null for text that is not a table", () => {
    expect(parseTable("| a | b |")).toBeNull();
    expect(parseTable("| a | b |\n| x | y |")).toBeNull();
    expect(parseTable("just text\nmore text")).toBeNull();
  });
});

describe("serializeTable", () => {
  it("is idempotent", () => {
    const once = serializeTable(must(parseTable(simple)));
    expect(serializeTable(must(parseTable(once)))).toBe(once);
  });
  it("pads columns to the widest cell and keeps content", () => {
    const text = serializeTable({
      header: ["a", "longer"],
      align: [null, null],
      rows: [["xxxxx", "1"]],
    });
    expect(text).toBe("| a     | longer |\n| ----- | ------ |\n| xxxxx | 1      |");
  });
  it("writes alignment markers", () => {
    const text = serializeTable({
      header: ["L", "C", "R"],
      align: ["left", "center", "right"],
      rows: [],
    });
    expect(text.split("\n")[1]).toBe("| :-- | :-: | --: |");
  });
  it("escapes pipes and newlines", () => {
    expect(escapeCell("a|b\nc")).toBe("a\\|b<br>c");
    const text = serializeTable({ header: ["x"], align: [null], rows: [["a|b"]] });
    expect(parseTable(text)?.rows[0]?.[0]).toBe("a|b");
  });
});

describe("lines inside a cell", () => {
  it("keeps new lines as <br> and gives them back for editing", () => {
    expect(cellSource("- one\n- two\n")).toBe("- one<br>- two");
    expect(cellText("- one<br>- two<BR />three")).toBe("- one\n- two\nthree");
  });
  it("leaves <br> in code, and a lone dash, as they are", () => {
    expect(cellText("`<br>` is a break")).toBe("`<br>` is a break");
    expect(cellSource("-")).toBe("-");
  });
  it("drops empty bullets at the end", () => {
    expect(cellSource("- one\n- \n\n")).toBe("- one");
  });
  it("survives saving the table twice", () => {
    const table = { header: ["a"], align: [null], rows: [["- x<br>- y"]] };
    const once = serializeTable(table);
    expect(parseTable(once)?.rows[0]).toEqual(["- x<br>- y"]);
    expect(serializeTable(must(parseTable(once)))).toBe(once);
  });
});

describe("splitRow", () => {
  it("handles missing outer pipes", () => {
    expect(splitRow("a | b")).toEqual(["a", "b"]);
  });
});

describe("edit operations", () => {
  const t = must(parseTable(simple));
  it("setCell edits body and header", () => {
    expect(setCell(t, 0, 1, "x").rows[0]).toEqual(["1", "x"]);
    expect(setCell(t, -1, 0, "H").header[0]).toBe("H");
    expect(t.rows[0]).toEqual(["1", "2"]); // original untouched
  });
  it("insertRow adds at the top, middle and bottom", () => {
    expect(insertRow(t, -1).rows.length).toBe(2);
    expect(insertRow(t, -1).rows[0]).toEqual(["", ""]);
    expect(insertRow(t, 0).rows.length).toBe(2);
  });
  it("deleteRow keeps at least one body row", () => {
    expect(deleteRow(t, 0)).toBe(t);
    expect(deleteRow(insertRow(t, 0), 0).rows.length).toBe(1);
  });
  it("insertColumn and deleteColumn keep widths in sync", () => {
    const wider = insertColumn(t, -1);
    expect(wider.header.length).toBe(3);
    expect(wider.rows[0]?.length).toBe(3);
    expect(deleteColumn(wider, 0).header.length).toBe(2);
    expect(deleteColumn(t, 0)).toEqual(deleteColumn(t, 0));
    expect(deleteColumn(deleteColumn(t, 0), 0)).toEqual(deleteColumn(t, 0));
  });
  it("setAlign changes one column", () => {
    expect(setAlign(t, 1, "right").align).toEqual([null, "right"]);
  });
  it("emptyTable produces a parseable table", () => {
    const e = emptyTable(3, 2);
    expect(parseTable(serializeTable(e))?.rows.length).toBe(2);
  });
});
