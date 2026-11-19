import { Tag } from "lucide-react";
import {
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import type { Action } from "./treeUtils";

/**
 * "Tags" in the menu of a folder or a project: put a tag on every page in it, or take one off every
 * page. The window that follows says how many pages change before anything is written.
 */
export function FolderTagMenu({
  folder,
  name,
  onAction,
}: {
  folder: string;
  name: string;
  onAction: (a: Action) => void;
}) {
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>
        <Tag className="size-4" aria-hidden /> Tags
      </ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem
          onSelect={() => {
            onAction({ kind: "tagFolder", folder, name, on: true });
          }}
        >
          Add a tag to all pages…
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            onAction({ kind: "tagFolder", folder, name, on: false });
          }}
        >
          Remove a tag from all pages…
        </ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  );
}
