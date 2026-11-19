import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TagUse } from "@/bindings/TagUse";
import { cleanTag } from "@/components/TagPicker";
import { api } from "@/lib/api";
import { isSystemTag } from "@/lib/noteTags";
import { useTagStore } from "@/stores/tagStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { useTaskStore } from "@/stores/taskStore";

/** "3 pages and 2 tasks" for the question before a tag is deleted. */
function usedText(u: TagUse): string {
  const pages = `${String(u.pages.length)} ${u.pages.length === 1 ? "page" : "pages"}`;
  if (u.tasks === 0) return pages;
  return `${pages} and ${String(u.tasks)} ${u.tasks === 1 ? "task" : "tasks"}`;
}

/**
 * Go → Tags: the tags you use, how many pages use each, a way to see everything that has one
 * (the search), a field that makes a new one, and a way to delete one everywhere, after it says
 * what would change. A tag you make is offered when you tag something; it lives in
 * `.vault/meta.json` until something has it. Nexmio Work's own tags are not listed.
 */
export function TagManager() {
  const open = useUiStore((s) => s.tagsOpen);
  const tags = useTagStore((s) => s.tags);
  const [asking, setAsking] = useState<{ tag: string; use: TagUse } | null>(null);
  const [text, setText] = useState("");
  const [problem, setProblem] = useState(false);

  useEffect(() => {
    if (open) void useTagStore.getState().load();
  }, [open]);

  const mine = tags.filter((t) => !isSystemTag(t.tag));
  const close = (): void => {
    useUiStore.getState().setTagsOpen(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) close();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your tags</DialogTitle>
            <DialogDescription>
              Make a tag here or by putting it on a page, a task or an epic. Show finds everything
              that has it.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const tag = cleanTag(text);
              if (tag === null) {
                setProblem(true);
                return;
              }
              setText("");
              api
                .tagMake(tag)
                .then(() => useTagStore.getState().load())
                .catch(reportError);
            }}
          >
            <div className="flex gap-2">
              <Input
                aria-label="New tag"
                aria-invalid={problem}
                placeholder="A new tag, then Enter"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setProblem(false);
                }}
              />
              <Button type="submit" variant="outline" disabled={text.trim() === ""}>
                Make
              </Button>
            </div>
            {problem && (
              <p role="alert" className="text-xs text-destructive">
                A tag is one word: letters, digits, - and _.
              </p>
            )}
          </form>
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags yet.</p>
          ) : (
            <ul aria-label="Your tags" className="flex max-h-80 flex-col gap-1 overflow-auto">
              {mine.map((t) => (
                <li key={t.tag} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm">
                  <span className="min-w-0 flex-1 truncate">#{t.tag}</span>
                  <span className="text-xs text-muted-foreground">
                    {t.count === 0
                      ? "not used yet"
                      : `${String(t.count)} ${t.count === 1 ? "page" : "pages"}`}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Show everything with ${t.tag}`}
                    onClick={() => {
                      close();
                      useUiStore.getState().focusSearch(`tag:${t.tag}`);
                    }}
                  >
                    Show
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete the tag ${t.tag}`}
                    onClick={() => {
                      api
                        .tagUse(t.tag)
                        .then((use) => {
                          setAsking({ tag: t.tag, use });
                        })
                        .catch(reportError);
                    }}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={asking !== null}
        title={asking ? `Delete the tag ${asking.tag}?` : "Delete the tag?"}
        description={
          asking
            ? `It is taken off ${usedText(asking.use)}, everywhere. A #${asking.tag} written in the text of a page stays. A snapshot is saved first, so History can bring it back.`
            : ""
        }
        confirmLabel="Delete the tag"
        destructive
        onCancel={() => {
          setAsking(null);
        }}
        onConfirm={() => {
          const a = asking;
          setAsking(null);
          if (a === null) return;
          api
            .tagDelete(a.tag)
            .then(async () => {
              useVaultStore.setState((s) => ({
                indexNonce: s.indexNonce + 1,
                reloadNonce: s.reloadNonce + 1,
              }));
              await useTaskStore.getState().load();
              await useTagStore.getState().load();
              useUiStore.getState().toast(`The tag ${a.tag} is deleted.`);
            })
            .catch(reportError);
        }}
      />
    </>
  );
}
