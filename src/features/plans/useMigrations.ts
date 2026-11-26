import { useEffect, useMemo, useState } from "react";
import { allFolders } from "@/features/fileTree/treeUtils";
import { api } from "@/lib/api";
import { reportError } from "@/stores/uiStore";
import { usePlanStore } from "@/stores/planStore";
import { projectForPath, useVaultStore } from "@/stores/vaultStore";
import { migrations, type Migration } from "./migrate";

/** The tags of pages that are never moved as a page of a part. */
const KEPT_TAGS = ["epic", "meeting", "plan"];

/** What can be moved in the open plan's project; empty while that is being read, or in no project. */
export function useMigrations(): Migration[] {
  const planPath = usePlanStore((s) => s.path);
  const nodes = usePlanStore((s) => s.nodes);
  const files = useVaultStore((s) => s.files);
  const tree = useVaultStore((s) => s.tree);
  const resolver = useVaultStore((s) => s.resolver);
  const projects = useVaultStore((s) => s.projects);
  const [keep, setKeep] = useState<ReadonlySet<string> | null>(null);
  useEffect(() => {
    const run = { cancelled: false };
    Promise.all(KEPT_TAGS.map((tag) => api.taggedNotes(tag)))
      .then((found) => {
        if (!run.cancelled) setKeep(new Set(found.flat().map((n) => n.path)));
      })
      .catch(reportError);
    return () => {
      run.cancelled = true;
    };
  }, [tree]);
  return useMemo(() => {
    const project = projectForPath(projects, planPath);
    if (planPath === null || project === null || keep === null) return [];
    return migrations({
      planPath,
      project: project.folder,
      nodes,
      files,
      folders: allFolders(tree),
      resolve: (t) => resolver.resolve(t),
      keep,
    });
  }, [planPath, nodes, files, tree, resolver, projects, keep]);
}
