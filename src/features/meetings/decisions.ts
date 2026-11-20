import type { Project } from "@/bindings/Project";
import { decisionsOf } from "@/lib/meeting";
import type { MeetingNote } from "@/lib/meetingList";
import { projectOfMeeting } from "./moveActions";

export interface DecisionLine {
  text: string;
  meeting: MeetingNote;
}

export interface DecisionGroup {
  /** The project the meetings belong to, or null for those in none. */
  project: Project | null;
  decisions: DecisionLine[];
}

/**
 * Every decision written in a meeting, grouped by the project of its meeting (projects in their
 * order, "no project" last), the newest meeting first. `projectId` keeps one project ("none" for
 * the meetings in none); `query` keeps the decisions whose words (or meeting) match.
 */
export function decisionGroups(
  meetings: readonly MeetingNote[],
  projects: readonly Project[],
  projectId: string | null = null,
  query = "",
): DecisionGroup[] {
  const q = query.trim().toLowerCase();
  const sorted = [...meetings].sort((a, b) =>
    `${b.meeting.date ?? ""} ${b.meeting.time ?? ""}`.localeCompare(
      `${a.meeting.date ?? ""} ${a.meeting.time ?? ""}`,
    ),
  );
  const groups = new Map<string, DecisionGroup>();
  for (const p of projects) groups.set(p.id, { project: p, decisions: [] });
  groups.set("none", { project: null, decisions: [] });
  for (const m of sorted) {
    const project = projectOfMeeting(m.meeting.tags, projects);
    const id = project?.id ?? "none";
    if (projectId !== null && projectId !== id) continue;
    for (const text of decisionsOf(m.content)) {
      if (q !== "" && !`${text} ${m.meeting.title}`.toLowerCase().includes(q)) continue;
      groups.get(id)?.decisions.push({ text, meeting: m });
    }
  }
  return [...groups.values()].filter((g) => g.decisions.length > 0);
}
