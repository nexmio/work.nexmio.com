import type { Project } from "@/bindings/Project";
import { api } from "@/lib/api";
import { flushPendingWrites } from "@/lib/flush";
import { projectTag } from "@/lib/noteTags";
import { isInside } from "@/lib/utils";
import { usePlanIndex } from "@/stores/planIndexStore";
import { planHome } from "@/stores/planStore";
import { useTaskStore } from "@/stores/taskStore";
import { reportError, useUiStore } from "@/stores/uiStore";

/** The project a meeting belongs to: the one whose tag the meeting has. */
export function projectOfMeeting(
  tags: readonly string[],
  projects: readonly Project[],
): Project | null {
  return projects.find((p) => tags.includes(projectTag(p))) ?? null;
}

/** Writes a line under `## Actions` of a meeting: where its actions went (a link to the epic). */
export function noteMovedActions(content: string, epicLink: string, count: number): string {
  const line = `Moved ${String(count)} ${count === 1 ? "action" : "actions"} to the project: [[${epicLink}]]`;
  const lines = content.split("\n");
  const head = lines.findIndex((l) => l.trim().toLowerCase() === "## actions");
  if (head === -1) return `${content.replace(/\n*$/, "")}\n\n## Actions\n\n${line}\n`;
  let end = lines.findIndex((l, i) => i > head && /^##\s/.test(l));
  if (end === -1) end = lines.length;
  // After the last line that is not empty in the section.
  let at = end;
  while (at > head + 1 && (lines[at - 1] ?? "").trim() === "") at--;
  lines.splice(at, 0, ...(at === head + 1 ? ["", line] : [line]));
  return lines.join("\n");
}

/**
 * Moves the actions (tasks) of a meeting into the epic of its project's plan, with their steps
 * and log, so they are in Tasks with the rest of the project. The meeting keeps a line that links
 * to the epic. Each task is found again by its title before it is moved (the lines move up).
 */
export async function moveActionsToProject(meetingPath: string, project: Project): Promise<void> {
  try {
    const plan = usePlanIndex.getState().paths.find((p) => isInside(p, project.folder));
    if (plan === undefined) {
      useUiStore
        .getState()
        .toast(`“${project.name}” has no plan yet. Make its plan in Projects first.`, "error");
      return;
    }
    const tasks = useTaskStore.getState();
    const epic = await tasks.epicFor(plan, planHome(plan).epics);
    if (epic === null) return;
    const titles = tasks.tasks.filter((t) => t.path === meetingPath).map((t) => t.title);
    for (const title of titles) {
      const now = useTaskStore
        .getState()
        .tasks.find((t) => t.path === meetingPath && t.title === title);
      if (now) await useTaskStore.getState().moveToEpic(now, epic);
    }
    await flushPendingWrites();
    const note = await api.readNote(meetingPath);
    await api.writeNote(
      meetingPath,
      noteMovedActions(note.content, epic.replace(/\.md$/i, ""), titles.length),
    );
    await useTaskStore.getState().load();
    useUiStore
      .getState()
      .toast(
        `Moved ${String(titles.length)} ${titles.length === 1 ? "action" : "actions"} to ${project.name}.`,
        "success",
        {
          label: "Open the epic",
          run: () => {
            useTaskStore.getState().openEpic(epic);
          },
        },
      );
  } catch (e) {
    reportError(e);
  }
}
