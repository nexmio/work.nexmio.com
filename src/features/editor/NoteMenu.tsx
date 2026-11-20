import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { PromptDialog } from "@/components/PromptDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PINNED_TAG } from "@/lib/startPage";
import { nameError } from "@/lib/nameConflict";
import { PlainButton } from "@/components/ui/plain-button";
import { searchForTag } from "@/lib/actions";
import { isSystemTag, NOTE_TAGS } from "@/lib/noteTags";
import { tagsOf } from "@/lib/outline";
import { getActiveEditor } from "@/lib/activeEditor";
import { useEditorStore } from "@/stores/editorStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useNoteTags } from "@/lib/useNoteTags";
import { dirname, joinPath } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { TagChip, TagsDialog } from "./TagsDialog";

/** The file name of a note without the folder and `.md`. */
function stem(path: string): string {
  return (path.split("/").pop() ?? path).replace(/\.md$/i, "");
}

/**
 * The `···` menu above a note: Rename, History, Tags and Export. A tag the note has shows beside
 * it as a chip with a cross that takes it off. A note without a tag shows only the button.
 */
export function NoteMenu({
  path,
  showTags = true,
}: {
  path: string | null;
  /** Show the tags the note has as chips beside the button (off where a tags line shows them). */
  showTags?: boolean;
}) {
  const { tags, setTag } = useNoteTags(path);
  const tree = useVaultStore((s) => s.tree);
  const projects = useVaultStore((s) => s.projects);
  const [renaming, setRenaming] = useState(false);
  const [tagging, setTagging] = useState(false);
  // Nexmio Work's tags first (in the order of the Tags window), then the person's own.
  const shown = [
    ...NOTE_TAGS.map((t) => t.tag).filter((t) => tags.includes(t)),
    ...tags.filter((t) => !isSystemTag(t)),
  ];
  return (
    <span className="flex items-center gap-1">
      {showTags &&
        shown.map((t) => (
          <TagChip
            key={t}
            tag={t}
            onTakeOff={() => {
              void setTag(t, false);
            }}
          />
        ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={path === null}
            aria-label="More for this page"
            title="Rename, history, tags and export"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onSelect={() => {
              setRenaming(true);
            }}
          >
            Rename…
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              useUiStore.getState().setRightTab("history");
            }}
          >
            History
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void setTag(PINNED_TAG, !tags.includes(PINNED_TAG));
            }}
          >
            {tags.includes(PINNED_TAG) ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setTagging(true);
            }}
          >
            Tags…
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              if (path !== null) {
                useUiStore.getState().openExportDialog({ path, isFolder: false });
              }
            }}
          >
            Export…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PromptDialog
        open={renaming && path !== null}
        title="Rename"
        label="New name"
        confirmLabel="Rename"
        initialValue={path === null ? "" : stem(path)}
        validate={(v) =>
          path === null ? null : nameError(tree, projects, dirname(path), v, false, path)
        }
        onCancel={() => {
          setRenaming(false);
        }}
        onSubmit={(name) => {
          setRenaming(false);
          if (path === null) return;
          const trimmed = name.trim();
          const file = /\.md$/i.test(trimmed) ? trimmed : `${trimmed}.md`;
          void useVaultStore.getState().renamePath(path, joinPath(dirname(path), file));
        }}
      />

      <TagsDialog
        open={tagging}
        onClose={() => {
          setTagging(false);
        }}
        path={path}
        tags={tags}
        setTag={setTag}
      />
    </span>
  );
}

/**
 * The tags of the open note as chips, and "+ tag", in one line above the text: the one place a
 * page's tags are shown. A cross takes a tag off; "+ tag" opens the Tags window. A `#tag` written
 * in the text is shown too, marked "in the text" (it is changed in the text, so it has no cross);
 * pressing it searches for the tag.
 */
export function NoteTagsLine({ path }: { path: string | null }) {
  const { tags, setTag } = useNoteTags(path);
  const [tagging, setTagging] = useState(false);
  // Read again when the page is saved (no file read: the editor holds the text).
  const pane = useWorkspaceStore((s) => s.layout.focused);
  const status = useEditorStore((s) => s.statuses[pane]);
  const inText = useMemo(() => {
    const ed = getActiveEditor();
    if (ed === null || ed.notePath !== path) return [];
    return tagsOf(ed.view.state.doc.toString()).filter((t) => !tags.includes(t));
    // `status` changes when the page is saved: that is when the text tags are read again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tags, status]);
  if (path === null) return null;
  const shown = [
    ...NOTE_TAGS.map((t) => t.tag).filter((t) => tags.includes(t)),
    ...tags.filter((t) => !isSystemTag(t)),
  ];
  return (
    <div
      data-testid="note-tags-line"
      className="flex shrink-0 flex-wrap items-center gap-1.5 px-4 py-1 text-xs"
    >
      {shown.map((t) => (
        <TagChip
          key={t}
          tag={t}
          onTakeOff={() => {
            void setTag(t, false);
          }}
        />
      ))}
      {inText.map((t) => {
        const own = NOTE_TAGS.find((n) => n.tag === t);
        // One of Nexmio Work's own tags written in the text does nothing there: offer to make it
        // the real one (in the properties). The text is not changed.
        if (own !== undefined) {
          return (
            <span key={`text-${t}`} className="flex items-center gap-1">
              <span
                title={`#${t} written in the text does nothing. ${own.label} is a tag of Nexmio Work, kept in the page's properties.`}
                className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground"
              >
                #{t} · in the text, does nothing
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  void setTag(t, true);
                }}
              >
                {own.makeIt}
              </Button>
            </span>
          );
        }
        return (
          <PlainButton
            key={`text-${t}`}
            type="button"
            title={`#${t} is written in the text. Press to find everything with it.`}
            className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              searchForTag(t);
            }}
          >
            #{t} · in the text
          </PlainButton>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-muted-foreground"
        onClick={() => {
          setTagging(true);
        }}
      >
        + tag
      </Button>
      <TagsDialog
        open={tagging}
        onClose={() => {
          setTagging(false);
        }}
        path={path}
        tags={tags}
        setTag={setTag}
      />
    </div>
  );
}
