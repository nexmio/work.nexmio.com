import { describe, expect, it } from "vitest";
import { parseMeeting } from "@/lib/meeting";
import type { MeetingNote } from "@/lib/meetingList";
import { makeTask } from "@/test/taskFixtures";
import { inProject, projectOverview, type OverviewInput } from "./overview";

const meeting = (
  path: string,
  date: string | null,
  body: string,
  tags = "[meeting]",
): MeetingNote => {
  const content = `---\ntags: ${tags}\n${date === null ? "" : `meeting: ${date} 10:00\n`}---\n# ${path}\n\n${body}`;
  return { path, content, meeting: parseMeeting(content) };
};

const base: OverviewInput = {
  planPath: "Server/Server move.md",
  folder: "Server",
  tag: "server-move",
  tasks: [],
  epics: [{ path: "Server/Epics/Server move.md", source: "Server/Server move" }],
  resolve: (t) => (t === "Server/Server move" ? "Server/Server move.md" : null),
  meetings: [],
  files: new Map(),
  tagged: new Set(),
  today: "2026-11-20",
};

describe("the Overview of a project", () => {
  it("counts the plan's tasks, finds Now and what waits, and the time this month", () => {
    const o = projectOverview({
      ...base,
      tasks: [
        makeTask({ path: "Server/Epics/Server move.md", title: "Old", done: true }),
        makeTask({
          path: "Server/Epics/Server move.md",
          line: 4,
          title: "Order the rack",
          log: [
            { line: 5, date: "2026-11-03", text: "⏱ 1 h 20 min · 09:00–10:20", key: "a" },
            { line: 6, date: "2026-10-30", text: "⏱ 30 min · 09:00–09:30", key: "b" },
          ],
        }),
        makeTask({
          path: "Server/Epics/Server move.md",
          line: 8,
          title: "Cabling quote",
          status: "waiting",
          waitingFor: "the supplier",
        }),
        makeTask({ path: "Tasks/Other.md", title: "Not this project" }),
      ],
    });
    expect([o.done, o.total]).toEqual([1, 3]);
    expect(o.now?.title).toBe("Order the rack");
    expect(o.waiting.map((t) => t.title)).toEqual(["Cabling quote"]);
    expect(o.minutesThisMonth).toBe(80);
  });

  it("takes the meetings with the project's tag or in its folder, and their decisions, newest first", () => {
    const tagged = meeting(
      "Meetings/Check-in.md",
      "2026-11-17",
      "## Decisions\n\n- The old rack goes\n",
      "[meeting, server-move]",
    );
    const inFolder = meeting(
      "Server/Kick-off.md",
      "2026-11-12",
      "## Decisions\n\n- Backup first\n",
    );
    const next = meeting("Meetings/Next.md", "2026-11-24", "", "[meeting, server-move]");
    const other = meeting("Meetings/Weekly.md", "2026-11-18", "## Decisions\n\n- Not ours\n");
    expect(inProject(other, "server-move", "Server")).toBe(false);
    const o = projectOverview({ ...base, meetings: [tagged, inFolder, next, other] });
    expect(o.next?.path).toBe("Meetings/Next.md");
    expect(o.past.map((m) => m.path)).toEqual(["Meetings/Check-in.md", "Server/Kick-off.md"]);
    expect(o.decisions.map((d) => d.text)).toEqual(["The old rack goes", "Backup first"]);
  });

  it("lists the newest pages in the project's folder, without the plan and the meetings", () => {
    const o = projectOverview({
      ...base,
      meetings: [meeting("Server/Kick-off.md", "2026-11-12", "")],
      files: new Map([
        ["Server/Server move.md", 9],
        ["Server/Kick-off.md", 8],
        ["Server/Notes/Rack layout.md", 7],
        ["Server/Notes/IP plan.md", 5],
        ["Work/Other.md", 10],
      ]),
    });
    expect(o.pages.map((p) => p.path)).toEqual([
      "Server/Notes/Rack layout.md",
      "Server/Notes/IP plan.md",
    ]);
  });

  it("lists the pages in the folder, and tagged pages that were moved away from it", () => {
    const o = projectOverview({
      ...base,
      files: new Map([
        ["Server/Notes/Network/Switches.md", 2],
        ["Archive/Racks.md", 3],
        ["Other/Page.md", 4],
        ["Server/Server move.md", 5],
      ]),
      tagged: new Set(["Archive/Racks.md", "Server/Server move.md"]),
    });
    expect(o.pages.map((p) => p.path)).toEqual([
      "Archive/Racks.md",
      "Server/Notes/Network/Switches.md",
    ]);
  });
});
