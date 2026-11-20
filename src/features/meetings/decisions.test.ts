import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { parseMeeting } from "@/lib/meeting";
import type { MeetingNote } from "@/lib/meetingList";
import { decisionGroups } from "./decisions";

const m = (path: string, date: string, decisions: string[], tags = "[meeting]"): MeetingNote => {
  const content = `---\ntags: ${tags}\nmeeting: ${date} 10:00\n---\n# ${path}\n\n## Decisions\n\n${decisions.map((d) => `- ${d}`).join("\n")}\n`;
  return { path, content, meeting: parseMeeting(content) };
};
const server = { id: "s", name: "Server move", folder: "Server", tag: "server-move" } as never;

describe("decisionGroups", () => {
  const meetings = [
    m("Kick-off.md", "2026-11-12", ["Backup first"], "[meeting, server-move]"),
    m("Weekly.md", "2026-10-30", ["Rollout starts Monday"]),
    m("Check-in.md", "2026-11-17", ["The old rack goes"], "[meeting, server-move]"),
  ];

  it("groups the decisions by project, no project last, the newest meeting first", () => {
    const groups = decisionGroups(meetings, [server]);
    expect(groups.map((g) => g.project?.name ?? "none")).toEqual(["Server move", "none"]);
    expect(groups[0]?.decisions.map((d) => d.text)).toEqual(["The old rack goes", "Backup first"]);
    expect(groups[1]?.decisions.map((d) => d.text)).toEqual(["Rollout starts Monday"]);
  });

  it("shows one project, or searches the words", () => {
    expect(decisionGroups(meetings, [server], "none").map((g) => g.project)).toEqual([null]);
    const found = decisionGroups(meetings, [server], null, "rack");
    expect(found.flatMap((g) => g.decisions.map((d) => d.text))).toEqual(["The old rack goes"]);
  });
});
