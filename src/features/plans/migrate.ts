import type { PageMove } from "@/bindings/PageMove";
import { splitText, type PlanNode } from "@/lib/planTree";
import { basename, dirname, isInside, isMarkdown } from "@/lib/utils";
import { PAGES_SUBFOLDER } from "@/stores/planStore";
import { partFolder, partPagePath } from "./partFolder";

/** The version that brought the folder per part; it is named on the button. */
export const FOLDERS_VERSION = "0.31";

/** The folder projects kept their pages in before. */
const OLD_SUBFOLDER = "Notes";

/** One page that can be moved to where a page of its part is kept now. */
export interface Migration extends PageMove {
  /**
   * Ticked from the start: the page is where Nexmio Work put it (the project's own folder, `Notes`
   * or `Pages`). A page in a folder someone chose is only moved when it is ticked.
   */
  ticked: boolean;
}

export interface MigrationInput {
  planPath: string;
  /** The project's folder. */
  project: string;
  nodes: readonly PlanNode[];
  files: readonly string[];
  folders: readonly string[];
  resolve: (target: string) => string | null;
  /** Pages that are something else than a page of a part: epics, meetings, plans. */
  keep: ReadonlySet<string>;
}

/** Whether `path` is already named and placed as a page of `part` in `folder`. */
function inPlace(path: string, folder: string, part: string): boolean {
  const expected = basename(partPagePath(folder, part, [])).replace(/\.md$/i, "");
  const name = basename(path).replace(/\.md$/i, "").replace(/ \d+$/, "");
  return (
    dirname(path).toLowerCase() === folder.toLowerCase() &&
    name.toLowerCase() === expected.toLowerCase()
  );
}

/**
 * The pages linked from the parts of a plan that are not where the folder structure puts them,
 * with where each would go. A page linked from several parts goes with the first one. Pages outside
 * the project, epics, meetings and plans are left alone.
 */
export function migrations(i: MigrationInput): Migration[] {
  const base = `${i.project}/${PAGES_SUBFOLDER}`;
  const taken = [...i.files];
  const folders = [...i.folders];
  const seen = new Set<string>();
  const out: Migration[] = [];
  const walk = (nodes: readonly PlanNode[], above: readonly string[]): void => {
    for (const node of nodes) {
      const { plain, links } = splitText(node.text);
      const trail = [...above, plain];
      for (const target of links) {
        // `page#task` points at a task, not at a page of the part.
        if (target.includes("#") || plain === "") continue;
        const from = i.resolve(target);
        if (from === null || seen.has(from) || !isMarkdown(from)) continue;
        seen.add(from);
        if (from === i.planPath || i.keep.has(from) || !isInside(from, i.project)) continue;
        const folder = partFolder(base, trail, folders);
        if (inPlace(from, folder, plain)) continue;
        const to = partPagePath(folder, plain, taken);
        taken.push(to);
        folders.push(folder);
        const ticked =
          dirname(from) === i.project ||
          [OLD_SUBFOLDER, PAGES_SUBFOLDER].some((f) => isInside(from, `${i.project}/${f}`));
        out.push({ from, to, ticked });
      }
      walk(node.children, trail);
    }
  };
  walk(i.nodes, []);
  return out;
}
