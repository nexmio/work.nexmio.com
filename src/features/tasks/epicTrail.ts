import type { Project } from "@/bindings/Project";
import type { TrailStep } from "@/components/Trail";
import { noteName } from "@/lib/taskLogic";
import { isInside } from "@/lib/utils";

/**
 * The trail of an epic or a task: the project the epic page is in, the page the epic was made
 * from (a plan, for an epic made from a part), the epic, and for a task its own place at the end.
 * `goProject` and `goPage` take you to the project's folder and to a page.
 */
export function epicTrail(args: {
  epicPath: string;
  epicTitle: string;
  /** The page the epic was made from, already resolved to a path (or null). */
  from: string | null;
  projects: readonly Project[];
  goProject: (folder: string) => void;
  goPage: (path: string) => void;
  /** Without it the epic is the place you are at. */
  goEpic?: () => void;
}): TrailStep[] {
  const { epicPath, epicTitle, from, projects, goProject, goPage, goEpic } = args;
  const project = projects.find((p) => isInside(epicPath, p.folder)) ?? null;
  const steps: TrailStep[] = [];
  if (project)
    steps.push({
      label: project.name,
      run: () => {
        goProject(project.folder);
      },
    });
  if (from !== null && from !== epicPath) {
    steps.push({
      label: noteName(from),
      run: () => {
        goPage(from);
      },
    });
  }
  if (project || from !== null) steps.push({ label: epicTitle, run: goEpic });
  return steps;
}
