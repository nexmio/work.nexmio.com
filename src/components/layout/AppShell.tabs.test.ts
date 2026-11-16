import { describe, expect, it } from "vitest";
import { rightTabsFor } from "./AppShell";

describe("the tabs of the right panel", () => {
  it("always has the page panels and the AI, in this order", () => {
    expect(rightTabsFor("notes")).toEqual(["outline", "links", "history", "images", "ai"]);
    expect(rightTabsFor("start")).toEqual(["outline", "links", "history", "images", "ai"]);
  });

  it("adds Task in front for every part of the Tasks area", () => {
    for (const v of ["tasks", "epic", "task"] as const) {
      expect(rightTabsFor(v)[0]).toBe("task");
    }
  });

  it("adds Part in front in the Plans area", () => {
    expect(rightTabsFor("plans")).toEqual(["part", "outline", "links", "history", "images", "ai"]);
  });
});
