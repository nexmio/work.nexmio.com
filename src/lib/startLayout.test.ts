import { describe, expect, it } from "vitest";
import {
  loadLayout,
  DEFAULT_LAYOUT,
  parseLayout,
  withMoved,
  withoutWidget,
  withWide,
  withWidget,
} from "./startLayout";

describe("parseLayout", () => {
  it("keeps known widgets once and drops the rest", () => {
    expect(
      parseLayout([
        { id: "recent", wide: true },
        { id: "recent", wide: false },
        { id: "nothing", wide: true },
        "x",
        { id: "pinned" },
      ]),
    ).toEqual([
      { id: "recent", wide: true },
      { id: "pinned", wide: false },
    ]);
  });
  it("is null for something that is not a list", () => {
    expect(parseLayout({})).toBeNull();
    expect(parseLayout(null)).toBeNull();
  });
});

describe("editing a layout", () => {
  const start = [...DEFAULT_LAYOUT];
  it("adds a widget once, at the end", () => {
    const a = withWidget(start, "capture");
    expect(a.map((p) => p.id)).toEqual([
      "today",
      "pinned",
      "recent",
      "epics",
      "plans",
      "week",
      "capture",
    ]);
    expect(withWidget(a, "capture")).toHaveLength(7);
  });
  it("removes, moves and widens", () => {
    expect(withoutWidget(start, "recent").map((p) => p.id)).toEqual([
      "today",
      "pinned",
      "epics",
      "plans",
      "week",
    ]);
    expect(withMoved(start, "recent", true).map((p) => p.id)).toEqual([
      "today",
      "recent",
      "pinned",
      "epics",
      "plans",
      "week",
    ]);
    expect(withMoved(start, "today", true)).toEqual(start);
    expect(withMoved(start, "week", false)).toEqual(start);
    expect(withWide(start, "recent", true)[2]).toEqual({ id: "recent", wide: true });
  });
});

describe("a saved layout", () => {
  it("is kept as it was saved, also when it has no Today card", () => {
    localStorage.setItem(
      "nexmio.startLayout",
      JSON.stringify([
        { id: "continue", wide: true },
        { id: "recent", wide: false },
      ]),
    );
    expect(loadLayout().map((p) => p.id)).toEqual(["continue", "recent"]);
    localStorage.clear();
    expect(loadLayout()[0]?.id).toBe("today");
  });
});
