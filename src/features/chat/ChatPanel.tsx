import { Loader2, Paperclip } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { folderNoteCounts } from "@/features/fileTree/treeUtils";
import { findMentionQuery, mentionCandidates, removeMentionQuery } from "@/lib/mentionQuery";
import { wakeIfNeeded } from "@/lib/wake";
import { useAiJobStore } from "@/stores/aiJobStore";
import { useChatStore } from "@/stores/chatStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { useActiveAi } from "./useActiveAi";
import { ChatHistoryMenu } from "./ChatHistoryMenu";
import { PrivacyNote } from "./PrivacyNote";
import { Bubble } from "./Bubble";
import { askChat } from "@/lib/askChat";
import { PlainButton } from "@/components/ui/plain-button";
import { useAiBlocked } from "@/lib/useAiBlocked";
import { ChatComposer } from "./ChatComposer";
import { ChatHeader } from "./ChatHeader";
import { JobsTab } from "./JobsTab";
import { ChatTabs } from "./ChatTabs";
import { MentionChips } from "./MentionChips";
import { MentionPicker } from "./MentionPicker";
import { AiMistakesNote } from "@/components/AiMistakesNote";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * "Ask about my notes": the assistant. It reads the open note, the notes and folders you point at
 * with `/`, your tasks, projects and meetings, and the help, to answer; it can propose tasks and
 * parts for review, and offer a place to open ("Show me"). It does not change pages (the AI
 * commands in the app do that). A run started from those commands shows its progress and
 * its review here. A built-in AI that is not loaded is loaded when you send.
 */
/** Questions an empty chat offers, so a new person sees what the assistant can do. */
const STARTERS = ["What should I do next?", "What am I waiting for?", "How do I make a project?"];

export function ChatPanel({ onClose }: { onClose?: () => void } = {}) {
  const aiOff = useAiBlocked();
  const {
    messages,
    streaming,
    includeNote,
    draftMentions,
    send,
    stop,
    newChat,
    setIncludeNote,
    addMention,
    removeMention,
  } = useChatStore();
  const tab = useAiJobStore((s) => s.tab);
  const focusNonce = useUiStore((s) => s.focusChatNonce);
  const activePath = useVaultStore((s) => s.activePath);
  const { project } = useActiveAi();
  const files = useVaultStore((s) => s.files);
  const tree = useVaultStore((s) => s.tree);
  const folders = useMemo(() => folderNoteCounts(tree), [tree]);
  const [draft, setDraft] = useState("");
  const [caret, setCaret] = useState(0);
  const [active, setActive] = useState(0);
  const [waking, setWaking] = useState(false);
  /** Position of a `/` the user closed with Esc; it stays closed until the text changes. */
  const [dismissed, setDismissed] = useState<number | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, [focusNonce]);

  const vaultPath = useVaultStore((s) => s.vault?.path ?? null);
  const refreshChats = useChatStore((s) => s.refreshChats);
  useEffect(() => {
    if (vaultPath !== null) void refreshChats();
  }, [vaultPath, refreshChats]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const slash = findMentionQuery(draft, caret);
  const pickerOpen = slash !== null && slash.start !== dismissed;
  const candidates = useMemo(
    () =>
      pickerOpen
        ? mentionCandidates(files, slash.query, project?.folder ?? null, draftMentions, 8, folders)
        : [],
    [pickerOpen, files, folders, slash?.query, project?.folder, draftMentions],
  );

  useEffect(() => {
    setActive(0);
  }, [slash?.query]);

  useEffect(() => {
    if (slash === null) setDismissed(null);
  }, [slash]);

  /** Attaches a note or folder and removes the `/text` that was typed to find it. */
  const pick = (path: string): void => {
    addMention(path);
    if (slash !== null) {
      const next = removeMentionQuery(draft, slash, caret);
      setDraft(next.text);
      setCaret(next.caret);
      requestAnimationFrame(() => {
        input.current?.setSelectionRange(next.caret, next.caret);
      });
    }
    input.current?.focus();
  };

  /** The paperclip types the `/` for the user, so both ways use the same list. */
  const openPicker = (): void => {
    const el = input.current;
    const at = el?.selectionStart ?? draft.length;
    const lead = at > 0 && !/\s/.test(draft.charAt(at - 1)) ? " " : "";
    setDraft(draft.slice(0, at) + lead + "/" + draft.slice(at));
    setCaret(at + lead.length + 1);
    setDismissed(null);
    el?.focus();
  };

  const submit = (): void => {
    if (draft.trim() === "" || waking) return;
    const text = draft;
    setWaking(true);
    void wakeIfNeeded()
      .then((problem) => {
        if (problem !== null) {
          useUiStore.getState().toast(problem, "error");
          return;
        }
        setDraft("");
        return send(text);
      })
      .catch(reportError)
      .finally(() => {
        setWaking(false);
      });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader onNew={newChat} onClose={onClose}>
        <ChatHistoryMenu />
      </ChatHeader>
      <ChatTabs />
      {tab === "tasks" ? (
        <JobsTab />
      ) : (
        <>
          <PrivacyNote />
          <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3" aria-live="polite">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Ask about your pages, tasks and projects, or how Nexmio Work works. The AI reads
                  the open page and looks up what it needs. Type <b>/</b> to point at a page or a
                  folder. It can propose tasks and parts for you to accept; to change a page, use
                  the AI button above it, the bar over selected text, or right-click a folder.
                </p>
                <ul
                  aria-label="Questions to start with"
                  className="flex flex-col items-start gap-1.5"
                >
                  {STARTERS.map((q) => (
                    <li key={q}>
                      <PlainButton
                        type="button"
                        className="rounded-full border px-3 py-1 text-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        disabled={aiOff !== null}
                        title={aiOff ?? undefined}
                        onClick={() => {
                          void askChat(q);
                        }}
                      >
                        {q}
                      </PlainButton>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {messages.map((m) => (
              <Bubble key={m.id} m={m} />
            ))}
            {waking && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
                Getting the AI ready…
              </p>
            )}
            <div ref={bottom} />
          </div>
          <div className="relative">
            {pickerOpen && (
              <MentionPicker
                items={candidates}
                activeIndex={active}
                folders={folders}
                onPick={pick}
              />
            )}
            <MentionChips paths={draftMentions} onRemove={removeMention} />
            <ChatComposer
              label="Message the AI"
              inputRef={input}
              placeholder="Ask about your pages…  (Enter to send, / to point at a page)"
              value={draft}
              onChange={(v, c) => {
                setDraft(v);
                setCaret(c);
              }}
              onSelect={setCaret}
              onKeyDown={(e) => {
                if (!pickerOpen || e.nativeEvent.isComposing) return false;
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  if (candidates.length > 0) {
                    const step = e.key === "ArrowDown" ? 1 : -1;
                    setActive((a) => (a + step + candidates.length) % candidates.length);
                  }
                  return true;
                }
                const chosen = candidates[active];
                if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey && chosen !== undefined) {
                  e.preventDefault();
                  pick(chosen);
                  return true;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setDismissed(slash.start);
                  return true;
                }
                return false;
              }}
              onSend={submit}
              onStop={() => void stop()}
              streaming={streaming}
              disabled={waking}
              leading={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Attach a page or folder"
                  title="Point at a page or a folder (or type /)"
                  disabled={streaming || waking}
                  onClick={openPicker}
                >
                  <Paperclip />
                </Button>
              }
            >
              <label className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                <Checkbox
                  checked={includeNote}
                  disabled={activePath === null}
                  onChange={(e) => {
                    setIncludeNote(e.target.checked);
                  }}
                />
                Include the open page
              </label>
            </ChatComposer>
            <AiMistakesNote className="px-3 pb-1.5 text-center" />
          </div>
        </>
      )}
    </div>
  );
}
