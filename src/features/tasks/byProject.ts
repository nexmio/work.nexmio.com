import type { Project } from "@/bindings/Project";
import type { EpicGroup } from "@/lib/taskLogic";
import { isInside } from "@/lib/utils";

/** The epics of one project (or the ones in none: `name` null), in the order they came. */
export interface ProjectSection {
  /** The project's folder, or null for the epics in no project. */
  folder: string | null;
  name: string | null;
  groups: EpicGroup[];
  /** There are project sections above this one, so it needs its "Other epics" heading. */
  others: boolean;
}

/**
 * Splits the epics by the project their page is in, projects in the order of their first epic,
 * and the epics in no project last. With no project at all it is one section with no heading.
 */
export function byProject(
  groups: readonly EpicGroup[],
  projects: readonly Project[],
): ProjectSection[] {
  const sections: ProjectSection[] = [];
  const rest: EpicGroup[] = [];
  for (const g of groups) {
    const project = projects.find((p) => isInside(g.path, p.folder));
    if (!project) {
      rest.push(g);
      continue;
    }
    const at = sections.find((s) => s.folder === project.folder);
    if (at) at.groups.push(g);
    else sections.push({ folder: project.folder, name: project.name, groups: [g], others: false });
  }
  if (rest.length > 0) {
    sections.push({ folder: null, name: null, groups: rest, others: sections.length > 0 });
  }
  return sections;
}
