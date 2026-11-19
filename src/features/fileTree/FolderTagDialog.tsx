import { useEffect, useMemo, useState } from "react";
import type { TagPreview } from "@/bindings/TagPreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlainButton } from "@/components/ui/plain-button";
import { api } from "@/lib/api";
import { cleanTagName, isSystemTag } from "@/lib/noteTags";
import { useTagStore } from "@/stores/tagStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { noteName } from "@/lib/taskLogic";

type TagFolder = { folder: string; name: string; on: boolean };

/** How many page names are shown in the preview. */
const SHOWN = 3;

/**
 * Puts a tag on every page in a folder or project, or takes one off. The tag is written in the
 * properties of each page (so any editor sees it) and only the pages that change are touched. The
 * window says how many that is before anything is written, and a snapshot is saved before and
 * after, so History can bring every page back. Nothing is inherited: a page added later has no tag.
 */
export function FolderTagDialog({
  action,
  close,
}: {
  action: TagFolder | null;
  close: () => void;
}) {
  const vaultTags = useTagStore((s) => s.tags);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<TagPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const open = action !== null;
  const on = action?.on ?? true;
  const tag = cleanTagName(text);
  const system = tag !== null && isSystemTag(tag);

  useEffect(() => {
    if (!open) return;
    setText("");
    setPreview(null);
    void useTagStore.getState().load();
  }, [open, action?.folder]);

  // What would change, read a moment after typing stops.
  useEffect(() => {
    if (action === null || tag === null || system) {
      setPreview(null);
      return;
    }
    let live = true;
    const id = setTimeout(() => {
      api
        .folderTagPreview(action.folder, tag, action.on)
        .then((p) => {
          if (live) setPreview(p);
        })
        .catch(() => {
          if (live) setPreview(null);
        });
    }, 250);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [action, tag, system]);

  const offered = useMemo(() => {
    const typed = text.trim().replace(/^#+/, "").toLowerCase();
    return vaultTags
      .filter((t) => !isSystemTag(t.tag) && t.tag.startsWith(typed))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, 8);
  }, [vaultTags, text]);

  const changing = preview?.changing.length ?? 0;
  const verb = on ? "Add" : "Remove";

  const apply = async (): Promise<void> => {
    if (action === null || tag === null || changing === 0) return;
    setBusy(true);
    try {
      const changed = await api.folderSetTag(action.folder, tag, action.on);
      const active = useVaultStore.getState().activePath;
      if (active !== null && changed.includes(active)) {
        useVaultStore.setState((s) => ({ reloadNonce: s.reloadNonce + 1 }));
      }
      void useTagStore.getState().load();
      useUiStore
        .getState()
        .toast(
          `${action.on ? "Tag put on" : "Tag taken off"} ${String(changed.length)} ${changed.length === 1 ? "page" : "pages"}. History can bring them back.`,
          "success",
        );
      close();
    } catch (e) {
      reportError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {on ? "Add a tag to all pages in" : "Remove a tag from all pages in"}{" "}
            {action?.name ?? ""}
          </DialogTitle>
          <DialogDescription>
            The tag is written in the properties of each page, so it works in any editor.{" "}
            {on
              ? "Pages that already have it are left alone. Pages added later do not get it."
              : "Pages without it are left alone."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void apply();
          }}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="folder-tag">Tag</Label>
            <Input
              id="folder-tag"
              autoFocus
              aria-invalid={text.trim() !== "" && (tag === null || system)}
              placeholder="For example: kunde-x"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
            />
            {text.trim() !== "" && tag === null && (
              <p role="alert" className="text-xs text-destructive">
                A tag is one word: letters, digits, - and _.
              </p>
            )}
            {system && (
              <p role="alert" className="text-xs text-destructive">
                “{tag}” is one of Nexmio Work's own tags and does something. Choose a tag of your
                own.
              </p>
            )}
            {offered.length > 0 && (
              <ul aria-label="Tags you already use" className="flex flex-wrap gap-1.5 pt-1">
                {offered.map((t) => (
                  <li key={t.tag}>
                    <PlainButton
                      type="button"
                      className="rounded-full border px-2.5 py-0.5 text-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => {
                        setText(t.tag);
                      }}
                    >
                      #{t.tag}
                      <span className="ml-1 text-muted-foreground">· {t.count}</span>
                    </PlainButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {preview !== null && (
            <div role="status" className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-semibold">
                {preview.total} {preview.total === 1 ? "page" : "pages"} in {action?.name} and its
                folders · {changing} will change
              </p>
              {changing > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {preview.changing.slice(0, SHOWN).map(noteName).join(" · ")}
                  {changing > SHOWN && ` · and ${String(changing - SHOWN)} more`}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  {on ? "Every page already has this tag." : "No page has this tag."}
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            A snapshot is saved before and after, so History can bring every page back as it was.
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={tag === null || system || changing === 0 || busy}>
              {changing === 0
                ? `${verb} the tag`
                : `${verb} the tag ${on ? "to" : "from"} ${String(changing)} ${changing === 1 ? "page" : "pages"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
