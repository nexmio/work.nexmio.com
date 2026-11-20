import { describe, expect, it } from "vitest";
import type { Project } from "@/bindings/Project";
import type { MeetingNote } from "@/lib/meetingList";
import { makeTask } from "@/test/taskFixtures";
import {
  changeText,
  isEmpty,
  lookBack,
  reportMarkdown,
  weekOf,
  weekSeconds,
  type LookBackInput,
} from "./lookBack";

const week = weekOf(0, new Date(2026, 10, 19)); // Thursday 19 Nov 2026

const project = (over: Partial<Project> = {}): Project => ({
  schemaVersion: 1,
  id: "p",
  name: "Move",
  folder: "Move",
  instructions: "",
  providerId: null,
  localOnly: false,
  createdAt: "",
  updatedAt: "",
  ...over,
});

const meeting = (path: string, date: string, content: string): MeetingNote =>
  ({
    path,
    content,
    meeting: { title: "Weekly", date, time: "10:00", tags: [] },
  }) as unknown as MeetingNote;

const input = (over: Partial<LookBackInput> = {}): LookBackInput => ({
  week,
  today: "2026-11-19",
  tasks: [],
  epics: [],
  meetings: [],
  pages: [],
  project: null,
  ...over,
});

const log = (date: string, text: string) => ({ line: 9, date, text, key: "k" });

describe("Look back", () => {
  it("knows the week from Monday to Sunday, its number and its seconds", () => {
    expect(week).toEqual({ from: "2026-11-16", to: "2026-11-22", number: 47 });
    expect(weekOf(-1, new Date(2026, 10, 19)).from).toBe("2026-11-09");
    expect(weekOf(0, new Date(2026, 10, 16)).from).toBe("2026-11-16");
    const s = weekSeconds(week);
    expect(s.to - s.from).toBe(7 * 86_400);
  });

  it("finds what was done, what moved on and the time in the week, by epic", () => {
    const done = makeTask({
      path: "Move/Tasks.md",
      title: "Book the van",
      done: true,
      history: [{ date: "2026-11-17", text: "Done" }],
      log: [log("2026-11-17", "⏱ 1 h 30 min"), log("2026-11-02", "⏱ 2 h")],
    });
    const waiting = makeTask({
      path: "Move/Tasks.md",
      title: "Keys",
      history: [{ date: "2026-11-18", text: "Status: waiting" }],
    });
    const before = makeTask({
      title: "Old",
      done: true,
      history: [{ date: "2026-11-02", text: "Done" }],
    });
    const reopened = makeTask({
      title: "Again",
      history: [{ date: "2026-11-18", text: "Open again" }],
    });
    const l = lookBack(
      input({
        tasks: [done, waiting, before, reopened],
        epics: [
          { path: "Move/Tasks.md", title: "Moving", source: null, description: "", tags: [] },
        ],
      }),
    );
    expect(l.done.map((d) => [d.task.title, d.epic, d.date])).toEqual([
      ["Book the van", "Moving", "2026-11-17"],
    ]);
    expect(l.moved.map((m) => [m.task.title, changeText(m.change)])).toEqual([
      ["Keys", "now waiting"],
    ]);
    expect(l.time).toEqual([{ epic: "Moving", minutes: 90 }]);
    expect(l.minutes).toBe(90);
  });

  it("keeps the meetings of the week with their decisions, and only one project when chosen", () => {
    const a = meeting("Move/Weekly.md", "2026-11-19", "# Weekly\n\n## Decisions\n\n- Blue van\n");
    const b = meeting("Other/Weekly.md", "2026-11-18", "# Weekly\n");
    const old = meeting("Move/Old.md", "2026-11-09", "# Weekly\n");
    const all = lookBack(input({ meetings: [a, b, old] }));
    expect(all.meetings.map((m) => m.meeting.path)).toEqual(["Move/Weekly.md", "Other/Weekly.md"]);
    expect(all.meetings[0]?.decisions).toEqual(["Blue van"]);
    const one = lookBack(
      input({
        meetings: [a, b],
        pages: [
          { path: "Move/Plan.md", changes: 2, new: false, time: 0 },
          { path: "Other/X.md", changes: 1, new: true, time: 0 },
        ],
        project: project(),
      }),
    );
    expect(one.meetings.map((m) => m.meeting.path)).toEqual(["Move/Weekly.md"]);
    expect(one.pages.map((p) => p.path)).toEqual(["Move/Plan.md"]);
  });

  it("leaves a Local AI only project out entirely when asked to", () => {
    const secret = project({ id: "s", name: "Secret", folder: "Secret", localOnly: true });
    const l = lookBack(
      input({
        tasks: [
          makeTask({
            path: "Secret/T.md",
            done: true,
            history: [{ date: "2026-11-17", text: "Done" }],
          }),
        ],
        meetings: [meeting("Secret/M.md", "2026-11-17", "# M\n")],
        pages: [{ path: "Secret/P.md", changes: 1, new: false, time: 0 }],
        leaveOut: [secret],
      }),
    );
    expect(isEmpty(l)).toBe(true);
  });

  it("writes the report with fixed headings and the person's own lines", () => {
    const l = lookBack(
      input({
        tasks: [
          makeTask({
            title: "Book the van",
            done: true,
            history: [{ date: "2026-11-17", text: "Done" }],
          }),
        ],
        meetings: [meeting("M.md", "2026-11-19", "# Weekly\n\n## Decisions\n\n- Blue van\n")],
      }),
    );
    const md = reportMarkdown(l, week, null);
    expect(md).toMatch(/^## Week 47 \(16\/11–22\/11\)/);
    expect(md).toContain("### Done\n- Book the van (Acme)");
    expect(md).toContain("### Decided\n- Blue van (Weekly)");
    expect(reportMarkdown(lookBack(input()), week, null)).toContain(
      "Nothing was recorded this week.",
    );
  });
});
