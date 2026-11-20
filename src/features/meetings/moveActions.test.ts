import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { buildMeetingNote, nextMeetingSeed, parseMeeting } from "@/lib/meeting";
import { noteMovedActions, projectOfMeeting } from "./moveActions";

const project = (name: string, tag?: string) => ({ id: name, name, folder: name, tag }) as never;

describe("a meeting in a project", () => {
  it("writes the project's tag with meeting, reads it back, and keeps it for the next meeting", () => {
    const text = buildMeetingNote({
      title: "Server check-in",
      date: "2026-11-24",
      time: "10:00",
      people: [],
      agenda: [],
      tags: ["server-move"],
    });
    expect(text).toContain("tags: [meeting, server-move]");
    expect(parseMeeting(text).tags).toEqual(["server-move"]);
    expect(nextMeetingSeed(text).tags).toEqual(["server-move"]);
    expect(parseMeeting("---\ntags: [meeting]\n---\n# A\n").tags).toEqual([]);
  });

  it("finds the project by its tag (given, or made from its name)", () => {
    const projects = [project("Office"), project("Server move", "srv")];
    expect(projectOfMeeting(["srv"], projects)?.name).toBe("Server move");
    expect(projectOfMeeting(["office"], projects)?.name).toBe("Office");
    expect(projectOfMeeting([], projects)).toBeNull();
  });

  it("leaves a line with a link to the epic under Actions", () => {
    const page =
      "# M\n\n## Notes\n\nHello\n\n## Actions\n\n- [ ] Order the rack\n\n## Decisions\n\n- Go\n";
    const after = noteMovedActions(
      page.replace("- [ ] Order the rack\n", ""),
      "Server/Epics/Server move",
      1,
    );
    expect(after).toContain(
      "## Actions\n\nMoved 1 action to the project: [[Server/Epics/Server move]]\n",
    );
    expect(after).toContain("## Decisions\n\n- Go");
    expect(noteMovedActions("# M\n", "E", 2)).toContain(
      "## Actions\n\nMoved 2 actions to the project: [[E]]",
    );
  });
});
