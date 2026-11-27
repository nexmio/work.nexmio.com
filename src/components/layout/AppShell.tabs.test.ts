import { describe, expect, it } from "vitest";
import { rightTabsFor } from "./AppShell";

describe("the tabs of the right panel", () => {
  it("has the page panels where a page is open, and never the AI (it is a box of its own)", () => {
    expect(rightTabsFor("notes")).toEqual(["outline", "links", "history", "images"]);
    expect(rightTabsFor("start")).toEqual(["outline", "links", "history", "images"]);
  });

  it("never shows another page's outline, links, history or images in an area without a page", () => {
    for (const v of ["tasks", "epic", "task", "time", "ideas", "meetings", "plans"] as const) {
      const tabs = rightTabsFor(v);
      for (const pageTab of ["outline", "links", "history", "images"] as const) {
        expect(tabs).not.toContain(pageTab);
      }
    }
  });

  it("adds Task for the task list and an epic, but not for a task page", () => {
    expect(rightTabsFor("tasks")).toEqual([]);
    expect(rightTabsFor("epic")).toEqual(["task"]);
    expect(rightTabsFor("task")).toEqual([]);
  });

  it("has the Timer tab only while a timer runs", () => {
    expect(rightTabsFor("notes", true)).toEqual(["outline", "links", "history", "images", "timer"]);
    expect(rightTabsFor("time", true)).toEqual(["timer"]);
    expect(rightTabsFor("notes", false)).not.toContain("timer");
  });

  it("adds Part in the Plans area", () => {
    expect(rightTabsFor("plans")).toEqual(["part"]);
  });
});
