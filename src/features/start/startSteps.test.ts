import { describe, expect, it } from "vitest";
import { makeTask } from "@/test/taskFixtures";
import { startSteps, type StartFacts } from "./startSteps";

const none: StartFacts = { plans: [], tasks: [], epics: [], meetings: 0, resolve: () => null };
const done = (f: StartFacts) =>
  startSteps(f)
    .filter((s) => s.done)
    .map((s) => s.id);

describe("Get started", () => {
  it("has nothing done in a new vault", () => {
    expect(done(none)).toEqual([]);
    expect(startSteps(none).map((s) => s.label)).toEqual([
      "Make a plan",
      "Break it into parts",
      "Make a task of a part",
      "Start a timer on a task",
      "Write a meeting",
    ]);
  });

  it("ticks each step from what the vault shows", () => {
    const facts: StartFacts = {
      plans: [{ path: "Move/Move.md", ideas: 3 }],
      epics: [
        { path: "Move/Epics/Move.md", source: "Move/Move" },
        { path: "Tasks/Other.md", source: null },
      ],
      tasks: [
        makeTask({ path: "Move/Epics/Move.md", title: "Book the van" }),
        makeTask({
          path: "Tasks/Other.md",
          title: "Timed",
          log: [{ line: 3, date: "2026-11-19", text: "⏱ 25 min · 09:00–09:25", key: "l1" }],
        }),
      ],
      meetings: 1,
      resolve: (t) => (t === "Move/Move" ? "Move/Move.md" : null),
    };
    expect(done(facts)).toEqual(["plan", "parts", "task", "timer", "meeting"]);
  });

  it("does not count a plan with one part, or a task in an epic that is not a plan's", () => {
    const facts: StartFacts = {
      ...none,
      plans: [{ path: "P.md", ideas: 1 }],
      epics: [{ path: "Tasks/Other.md", source: null }],
      tasks: [makeTask({ path: "Tasks/Other.md", title: "One" })],
    };
    expect(done(facts)).toEqual(["plan"]);
  });
});
