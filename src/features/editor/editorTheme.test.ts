import { describe, expect, it } from "vitest";
import { editorStyles } from "./editorTheme";

const BLOCKS = [
  ".cm-properties-wrap",
  ".cm-properties",
  ".cm-table-widget",
  ".cm-mermaid-wrap",
  ".cm-mermaid",
];

describe("editor styles", () => {
  it.each(BLOCKS)("%s has no margin, so the lines below are measured right", (name) => {
    const rules = (editorStyles as Record<string, Record<string, string>>)[name];
    expect(rules).toBeDefined();
    expect(Object.keys(rules ?? {}).filter((k) => k.startsWith("margin"))).toEqual([]);
  });
});
