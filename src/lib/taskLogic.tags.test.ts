import { describe, expect, it } from "vitest";
import { makeTask } from "@/test/taskFixtures";
import { groupHasTag, tagsOfTask, taskHasTag, tasksWithTag, usedTags } from "./taskLogic";

const epics = [
  { path: "Tasks/Acme.md", tags: ["kunde-x"] },
  { path: "Tasks/Home.md", tags: [] },
];
const a = makeTask({ path: "Tasks/Acme.md", key: "a", title: "A", tags: ["juridisk"] });
const b = makeTask({ path: "Tasks/Acme.md", key: "b", title: "B", tags: [] });
const c = makeTask({ path: "Tasks/Home.md", key: "c", title: "C", tags: ["intern"] });
const d = makeTask({ path: "Tasks/Home.md", key: "d", title: "D", tags: [] });

describe("tags on tasks and epics", () => {
  it("a task has its own tags and those of its epic, apart", () => {
    expect(tagsOfTask(a, epics)).toEqual({ own: ["juridisk"], inherited: ["kunde-x"] });
    expect(tagsOfTask(c, epics)).toEqual({ own: ["intern"], inherited: [] });
  });

  it("a tag on an epic counts for all its tasks", () => {
    expect(taskHasTag(b, epics, "kunde-x")).toBe(true);
    expect(taskHasTag(d, epics, "kunde-x")).toBe(false);
    expect(taskHasTag(c, epics, "intern")).toBe(true);
  });

  it("lists every tag in use once, sorted", () => {
    expect(usedTags([a, b, c, d], epics)).toEqual(["intern", "juridisk", "kunde-x"]);
  });

  it("an area shows all its tasks when the epic has the tag, else only the tasks that have it", () => {
    const acme = { path: "Tasks/Acme.md", tasks: [a, b] };
    const home = { path: "Tasks/Home.md", tasks: [c, d] };
    expect(tasksWithTag(acme, epics, "kunde-x")).toEqual([a, b]);
    expect(tasksWithTag(home, epics, "intern")).toEqual([c]);
    expect(tasksWithTag(home, epics, null)).toEqual([c, d]);
    expect(groupHasTag(home, epics, "kunde-x")).toBe(false);
    expect(groupHasTag(home, epics, "intern")).toBe(true);
    expect(groupHasTag(acme, epics, null)).toBe(true);
  });
});
