import {
  ChevronDown,
  ChevronRight,
  Download,
  FilePlus,
  FolderKanban,
  FolderPlus,
  FolderSearch,
  ListTree,
  Network,
  Pencil,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Project } from "@/bindings/Project";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePlanIndex } from "@/stores/planIndexStore";
import { isProjectOpen, useTreeStore } from "@/stores/treeStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { FileTree } from "./FileTree";
import { FolderTagMenu } from "./FolderTagMenu";
import { droppedPaths, moveMany } from "./treeMoves";
import { SidebarSection } from "./SidebarSection";
import { countNotes, filterTree, findFolder, withoutImages, type Action } from "./treeUtils";
import { reportError } from "@/stores/uiStore";
import { PlainButton } from "@/components/ui/plain-button";

const small = "rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground";

function ProjectTree({ project, onAction }: { project: Project; onAction: (a: Action) => void }) {
  const tree = useVaultStore((s) => s.tree);
  const filter = useTreeStore((s) => s.filter);
  const open = useTreeStore((s) => isProjectOpen(s, project.folder));
  const setOpen = useTreeStore((s) => s.setProjectOpen);
  const [dragOver, setDragOver] = useState(false);
  const folder = findFolder(tree, project.folder);
  const planPaths = usePlanIndex((s) => s.paths);
  const planIndexLoaded = usePlanIndex((s) => s.loaded);
  const plan = planPaths.find((p) => p.startsWith(`${project.folder}/`));
  const children = withoutImages(folder?.children ?? []);
  const filtering = filter.trim() !== "";
  // While filtering, a project with nothing that matches is left out.
  if (filtering && filterTree(children, filter).length === 0) return null;
  const shown = open || filtering;
  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group flex items-center gap-0.5 rounded px-1 hover:bg-muted",
              dragOver && "ring-1 ring-primary",
            )}
            data-testid={`project-${project.folder}`}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("application/x-nexmio-path")) {
                e.preventDefault();
                setDragOver(true);
              }
            }}
            onDragLeave={() => {
              setDragOver(false);
            }}
            onDrop={(e) => {
              setDragOver(false);
              const paths = droppedPaths(e.dataTransfer);
              if (paths.length === 0) return;
              e.preventDefault();
              void moveMany(paths, project.folder)
                .then((moved) => {
                  if (moved > 0) setOpen(project.folder, true);
                })
                .catch(reportError);
            }}
          >
            <PlainButton
              type="button"
              title={project.folder}
              aria-expanded={shown}
              className="flex min-w-0 flex-1 items-center gap-1.5 py-[3px] text-left text-[13px]"
              onClick={() => {
                useVaultStore.getState().select(project.folder);
                setOpen(project.folder, !open);
              }}
            >
              {shown ? (
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <FolderKanban className="size-4 shrink-0 text-primary" />
              <span className="truncate font-medium text-primary">{project.name}</span>
              <span className="ml-auto shrink-0 pl-2 text-[11px] tabular-nums text-muted-foreground">
                {folder ? countNotes(folder) : 0}
              </span>
            </PlainButton>
            <PlainButton
              type="button"
              className={small}
              aria-label={`New page in ${project.name}`}
              title="New page in this project"
              onClick={() => {
                setOpen(project.folder, true);
                onAction({ kind: "newNote", folder: project.folder });
              }}
            >
              <FilePlus className="size-3.5" />
            </PlainButton>
            <PlainButton
              type="button"
              className={small}
              aria-label={`Settings for ${project.name}`}
              title="Project settings"
              onClick={() => {
                useUiStore.getState().openProjectDialog({ folder: project.folder, project });
              }}
            >
              <Settings2 className="size-3.5" />
            </PlainButton>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onSelect={() => {
              setOpen(project.folder, true);
              onAction({ kind: "newNote", folder: project.folder });
            }}
          >
            <FilePlus className="size-4" aria-hidden /> New page
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => {
              setOpen(project.folder, true);
              onAction({ kind: "newFolder", folder: project.folder });
            }}
          >
            <FolderPlus className="size-4" aria-hidden /> New folder
          </ContextMenuItem>
          <FolderTagMenu folder={project.folder} name={project.name} onAction={onAction} />
          {folder && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onSelect={() => {
                  onAction({ kind: "rename", node: folder });
                }}
              >
                <Pencil className="size-4" aria-hidden /> Rename
              </ContextMenuItem>
              <ContextMenuItem
                className="text-destructive"
                onSelect={() => {
                  onAction({ kind: "delete", node: folder });
                }}
              >
                <Trash2 className="size-4" aria-hidden /> Delete
              </ContextMenuItem>
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={() => {
              void useVaultStore.getState().createIndexPage(project.folder);
            }}
          >
            <ListTree className="size-4" aria-hidden /> Create index page
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => {
              useUiStore.getState().planFromProject(project.folder);
            }}
          >
            <Network className="size-4" aria-hidden /> Make a plan of this project
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => {
              useUiStore.getState().openProjectDialog({ folder: project.folder, project });
            }}
          >
            <Settings2 className="size-4" aria-hidden /> Project settings
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => {
              useUiStore.getState().openExportDialog({ path: project.folder, isFolder: true });
            }}
          >
            <Download className="size-4" aria-hidden /> Export…
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={() => {
              api.revealInFileManager(project.folder).catch(reportError);
            }}
          >
            <FolderSearch className="size-4" aria-hidden /> Reveal in file manager
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {planIndexLoaded && (
        <div className="pb-0.5 pl-7 text-[11px] text-muted-foreground">
          {plan !== undefined ? (
            <PlainButton
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                useUiStore.getState().openPlan(plan);
              }}
            >
              Open the plan
            </PlainButton>
          ) : (
            <>
              No plan yet ·{" "}
              <PlainButton
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  useUiStore.getState().planFromProject(project.folder);
                }}
              >
                Make a plan
              </PlainButton>
            </>
          )}
        </div>
      )}
      {shown && (
        <FileTree
          nodes={children}
          rootFolder={project.folder}
          emptyText="No pages yet. Use the + button, or drag a page here."
          className="py-0 pl-3"
          onAction={onAction}
        />
      )}
    </li>
  );
}

/**
 * Every project with its own files. Projects are not part of "All files": here you open their
 * notes, create new ones, and drag notes in from the rest of the vault.
 */
export function ProjectsSection({ onAction }: { onAction: (a: Action) => void }) {
  const projects = useVaultStore((s) => s.projects);
  const files = useVaultStore((s) => s.files);
  // Which projects have a plan is read when the list of pages changes (a plan is a page).
  useEffect(() => {
    void usePlanIndex.getState().load();
  }, [files]);
  if (projects.length === 0) return null;
  const sorted = [...projects].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );
  return (
    <SidebarSection title="Projects" storageKey="projects" count={projects.length}>
      <ul>
        {sorted.map((p) => (
          <ProjectTree key={p.id} project={p} onAction={onAction} />
        ))}
      </ul>
    </SidebarSection>
  );
}
