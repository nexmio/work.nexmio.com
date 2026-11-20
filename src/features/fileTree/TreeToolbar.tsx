import {
  ArrowDownUp,
  Check,
  ChevronsDownUp,
  Crosshair,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { PromptDialog } from "@/components/PromptDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { revealInTree } from "@/lib/actions";
import { useNarrow } from "@/lib/useNarrow";
import { nameError } from "@/lib/nameConflict";
import { useTreeStore } from "@/stores/treeStore";
import { useUiStore } from "@/stores/uiStore";
import { currentFolder, useVaultStore } from "@/stores/vaultStore";
import { PlainButton } from "@/components/ui/plain-button";

const iconButton = "rounded p-1 hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent";

/** Below this width the tree tools go into a "More" menu, so nothing is cut off at the edge. */
const NARROW = 280;

const SORTS: { id: "name" | "modified" | "manual"; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "modified", label: "Last changed" },
  { id: "manual", label: "My own order" },
];

type Asking = "folder" | null;

/**
 * The row above the file tree: its ··· menu (new folder, new project; and the tools when the panel
 * is narrow), collapse all, show the open page and sort. Pages, meetings and the daily page are
 * made with New at the top of the navigation and in File.
 */
export function TreeToolbar() {
  const activePath = useVaultStore((s) => s.activePath);
  const sort = useTreeStore((s) => s.sort);
  const setSort = useTreeStore((s) => s.setSort);
  const [asking, setAsking] = useState<Asking>(null);
  const { ref, narrow } = useNarrow<HTMLDivElement>(NARROW);

  const folder = (): string => {
    const v = useVaultStore.getState();
    return currentFolder(v) || (v.vault?.config.newNoteFolder ?? "");
  };

  const makeFolder = async (name: string): Promise<void> => {
    const v = useVaultStore.getState();
    const parent = currentFolder(v);
    const path = await v.createFolder(parent, name);
    if (path === null) return;
    useTreeStore.getState().expand(parent === "" ? path : parent);
  };

  return (
    <div
      ref={ref}
      className="flex h-9 shrink-0 items-center gap-1 border-b px-3 text-muted-foreground"
    >
      <h2 className="flex-1 truncate text-xs font-semibold text-foreground">Pages</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <PlainButton
            type="button"
            className={iconButton}
            aria-label="More for pages"
            title="New folder, new project and more"
          >
            <MoreHorizontal className="size-4" />
          </PlainButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem
            className="justify-start gap-2"
            onSelect={() => {
              setAsking("folder");
            }}
          >
            <FolderPlus className="size-4" /> New folder…
          </DropdownMenuItem>
          <DropdownMenuItem
            className="justify-start gap-2"
            onSelect={() => {
              // The same window as everywhere else: it makes the project and, if wanted, its plan.
              useUiStore.getState().requestNewPlan();
            }}
          >
            <FolderOpen className="size-4" /> New project…
          </DropdownMenuItem>
          {narrow && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  useTreeStore.getState().collapseAll();
                }}
              >
                <ChevronsDownUp className="size-4" /> Collapse all folders
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={activePath === null}
                onSelect={() => {
                  if (activePath !== null) revealInTree(activePath);
                }}
              >
                <Crosshair className="size-4" /> Show the open page in the tree
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sort</DropdownMenuLabel>
              {SORTS.map((o) => (
                <DropdownMenuItem
                  key={o.id}
                  onSelect={() => {
                    setSort(o.id);
                  }}
                >
                  {o.label} {sort === o.id && <Check className="size-4" aria-label="Selected" />}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {!narrow && (
        <>
          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
          <PlainButton
            type="button"
            className={iconButton}
            aria-label="Collapse all folders"
            title="Collapse all folders"
            onClick={() => {
              useTreeStore.getState().collapseAll();
            }}
          >
            <ChevronsDownUp className="size-4" />
          </PlainButton>
          <PlainButton
            type="button"
            className={iconButton}
            aria-label="Show the open page in the tree"
            title="Show the open page in the tree"
            disabled={activePath === null}
            onClick={() => {
              if (activePath !== null) revealInTree(activePath);
            }}
          >
            <Crosshair className="size-4" />
          </PlainButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <PlainButton
                type="button"
                className={iconButton}
                aria-label="Sort"
                title="Sort the pages"
              >
                <ArrowDownUp className="size-4" />
              </PlainButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onSelect={() => {
                  setSort("name");
                }}
              >
                Name {sort === "name" && <Check className="size-4" aria-label="Selected" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setSort("modified");
                }}
              >
                Last changed{" "}
                {sort === "modified" && <Check className="size-4" aria-label="Selected" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setSort("manual");
                }}
              >
                My own order{" "}
                {sort === "manual" && <Check className="size-4" aria-label="Selected" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
        </>
      )}

      <PromptDialog
        open={asking === "folder"}
        title="New folder"
        label="Folder name"
        confirmLabel="Create"
        validate={(v) => {
          const state = useVaultStore.getState();
          return nameError(state.tree, state.projects, currentFolder(state), v, true);
        }}
        onCancel={() => {
          setAsking(null);
        }}
        onSubmit={(name) => {
          setAsking(null);
          void makeFolder(name.trim());
        }}
      />
      <span className="sr-only">
        {folder() === "" ? "Creating in the vault root" : `Creating in ${folder()}`}
      </span>
    </div>
  );
}
