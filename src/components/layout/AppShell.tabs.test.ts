import { describe, expect, it } from "vitest";
import { rightTabsFor } from "./AppShell";

describe("the tabs of the right panel", () => {
  it("always has the page panels and the AI, in this order", () => {
    expect(rightTabsFor("notes")).toEqual(["outline", "links", "history", "images", "ai"]);
    expect(rightTabsFor("start")).toEqual(["outline", "links", "history", "images", "ai"]);
  });

  it("adds Task in front for the task list and an epic, but not for a task page", () => {
    for (const v of ["tasks", "epic"] as const) {
      expect(rightTabsFor(v)[0]).toBe("task");
    }
    expect(rightTabsFor("task")).toEqual(["outline", "links", "history", "images", "ai"]);
  });

  it("has the Timer tab only while a timer runs", () => {
    expect(rightTabsFor("notes", true)).toEqual([
      "outline",
      "links",
      "history",
      "images",
      "timer",
      "ai",
    ]);
    expect(rightTabsFor("notes", false)).not.toContain("timer");
  });

  it("adds Part in front in the Plans area", () => {
    expect(rightTabsFor("plans")).toEqual(["part", "outline", "links", "history", "images", "ai"]);
  });
});
