import { describe, expect, it } from "vitest";
import type { Task } from "@/bindings/Task";
import {
  INBOX,
  epicGroups,
  areaLists,
  LOOSE_AREA,
  nextStep,
  pickArea,
  openThenDone,
  stepsFromAnswer,
  taskText,
  taskRef,
  afterTarget,
  latestLeftOff,
  leftOffLine,
  recentLeftOff,
} from "./taskLogic";

function task(patch: Partial<Task>): Task {
  return {
    path: "A.md",
    line: 0,
    end: 0,
    key: "k",
    title: "T",
    done: false,
    tags: [],
    status: null,
    waitingFor: null,
    history: [],
    pinned: false,
    after: null,
    steps: [],
    log: [],
    note: "",
    made: null,
    link: null,
    ...patch,
  };
}

describe("taskText", () => {
  it("keeps what was typed as the title: date words are not read", () => {
    expect(taskText("  Call   Mette tomorrow ")).toBe("Call Mette tomorrow");
    expect(taskText("Pay the bill fri ~15m")).toBe("Pay the bill fri ~15m");
  });
});

describe("epicGroups", () => {
  it("puts the Inbox first and keeps the tasks in the order of the page", () => {
    const tasks = [
      task({ path: "Tasks/B.md", line: 4, title: "Second" }),
      task({ path: "Tasks/B.md", line: 2, title: "First", made: "2026-10-12" }),
      task({ path: INBOX, line: 1, title: "Quick" }),
    ];
    const epics = [
      { path: "Tasks/B.md", title: "B", source: null },
      { path: INBOX, title: "Inbox", source: null },
      { path: "Tasks/A.md", title: "A", source: null },
    ];
    const groups = epicGroups(tasks, epics);
    expect(groups.map((g) => g.title)).toEqual(["Inbox", "A", "B"]);
    const b = groups.find((g) => g.title === "B");
    expect(b?.tasks.map((t) => t.title)).toEqual(["First", "Second"]);
    expect(b?.made).toBe("2026-10-12");
  });
});

describe("stepsFromAnswer", () => {
  it("reads one step per line without bullets or numbers", () => {
    expect(
      stepsFromAnswer(
        "Here are the steps:\n1. List who has access\n- [ ] Ask Lene\n* **Write rules**\n\n",
      ),
    ).toEqual(["List who has access", "Ask Lene", "Write rules"]);
  });
});

describe("openThenDone", () => {
  it("puts the open tasks first and the done ones last, each in the order of the page", () => {
    const a = task({ title: "A", line: 0, done: true });
    const b = task({ title: "B", line: 1 });
    const c = task({ title: "C", line: 2, done: true });
    const d = task({ title: "D", line: 3, status: "dropped" });
    const e = task({ title: "E", line: 4 });
    const { open, done } = openThenDone([a, b, c, d, e]);
    expect(open.map((t) => t.title)).toEqual(["B", "E"]);
    expect(done.map((t) => t.title)).toEqual(["A", "C", "D"]);
  });
});

describe("one area at a time", () => {
  const doing = task({ title: "A", line: 0, status: "doing" });
  const waits = task({ title: "B", line: 1, status: "waiting", waitingFor: "the vendor" });
  const plain = task({ title: "D", line: 3 });
  const plain2 = task({ title: "E", line: 4 });
  const finished = task({ title: "F", line: 5, done: true });
  const dropped = task({ title: "G", line: 6, status: "dropped" });

  it("puts the Doing task now, the others after, the waiting ones apart and the done last", () => {
    const l = areaLists([plain, doing, waits, plain2, finished, dropped]);
    expect(l.now?.title).toBe("A");
    expect(l.after.map((t) => t.title)).toEqual(["D", "E"]);
    expect(l.waiting.map((t) => t.title)).toEqual(["B"]);
    expect(l.done.map((t) => t.title)).toEqual(["F", "G"]);
  });

  it("takes the first open task that is not waiting when nothing is Doing", () => {
    expect(areaLists([waits, plain, plain2]).now?.title).toBe("D");
    expect(areaLists([waits, finished]).now).toBeNull();
    expect(areaLists([]).now).toBeNull();
  });

  it("finds the next step to do", () => {
    const t = task({
      steps: [
        { line: 1, text: "one", done: true, key: "a" },
        { line: 2, text: "two", done: false, key: "b" },
      ],
    });
    expect(nextStep(t)).toEqual({ index: 1, text: "two" });
    expect(nextStep(task({}))).toBeNull();
  });

  it("picks the chosen area, else the first epic that is not done", () => {
    const groups = epicGroups(
      [
        task({ path: "Tasks/A.md", done: true }),
        task({ path: "Tasks/B.md", line: 1 }),
        task({ path: "Tasks/C.md", line: 2 }),
      ],
      [
        { path: "Tasks/A.md", title: "A", source: null },
        { path: "Tasks/B.md", title: "B", source: null },
        { path: "Tasks/C.md", title: "C", source: null },
      ],
    );
    expect(pickArea(groups, false, "Tasks/C.md")).toBe("Tasks/C.md");
    expect(pickArea(groups, false, "Tasks/Gone.md")).toBe("Tasks/B.md");
    expect(pickArea(groups, false, null)).toBe("Tasks/B.md");
    expect(pickArea(groups, true, LOOSE_AREA)).toBe(LOOSE_AREA);
    expect(pickArea(groups, false, LOOSE_AREA)).toBe("Tasks/B.md");
    expect(pickArea([], true, null)).toBe(LOOSE_AREA);
    expect(pickArea([], false, null)).toBeNull();
  });
});

describe("where you left off", () => {
  const log = (date: string, text: string) => ({ line: 1, date, text, key: "k" });

  it("writes one line and reads the latest one back", () => {
    expect(leftOffLine("  Take a  backup  ")).toBe("Left off: Take a backup");
    const t = task({
      log: [
        log("2026-11-01", "Left off: Old step"),
        log("2026-11-02", "Called Peter"),
        log("2026-11-03", "Left off: New step"),
      ],
    });
    expect(latestLeftOff(t)).toEqual({ date: "2026-11-03", text: "New step" });
    expect(latestLeftOff(task({ log: [log("2026-11-01", "Called Peter")] }))).toBeNull();
  });

  it("finds the newest one of the open tasks, not older than a week", () => {
    const a = task({ title: "A", log: [log("2026-11-05", "Left off: first")] });
    const b = task({ title: "B", log: [log("2026-11-08", "Left off: second")] });
    const old = task({ title: "C", log: [log("2026-10-01", "Left off: ancient")] });
    const done = task({ title: "D", done: true, log: [log("2026-11-09", "Left off: done")] });
    const r = recentLeftOff([a, b, old, done], "2026-11-10");
    expect(r?.task.title).toBe("B");
    expect(r?.text).toBe("second");
    expect(recentLeftOff([old], "2026-11-10")).toBeNull();
    expect(recentLeftOff([a], "2026-11-20")).toBeNull();
  });
});

describe("tasks that wait for another task", () => {
  const first = task({ path: "IT/Upgrade.md", title: "Test", line: 1 });
  const second = task({
    path: "IT/Upgrade.md",
    title: "Deploy",
    line: 2,
    after: "IT/Upgrade#Test",
  });

  it("names a task by its page and title", () => {
    expect(taskRef(first)).toBe("IT/Upgrade#Test");
  });

  it("finds the task another one waits for, or nothing when it is gone", () => {
    expect(afterTarget([first, second], second)?.title).toBe("Test");
    expect(afterTarget([second], second)).toBeNull();
    expect(afterTarget([first], first)).toBeNull();
  });
});
