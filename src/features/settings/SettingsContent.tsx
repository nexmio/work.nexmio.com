import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Settings } from "@/bindings/Settings";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { MarkdownText } from "@/components/MarkdownText";
import { HELP_TOPICS } from "@/features/help/helpTopics";
import { SettingsPreview } from "./SettingsPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { effectiveLocation } from "@/lib/providers";
import { resolveTimeFormat, type TimeFormat } from "@/lib/timeFormat";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settingsStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { ProviderEditor } from "./ProviderEditor";
import { ReadingSettings } from "./ReadingSettings";
import { TaskbarHelperSettings } from "./TaskbarHelperSettings";
import { ThemePicker } from "./ThemePicker";
import { AddProviderDialog } from "./AddProviderDialog";
import { AiChoice } from "./AiChoice";
import { BetaBadge } from "@/components/BetaBadge";
import { VaultSettingsTab } from "./VaultSettingsTab";
import { SemanticSearchSettings } from "./SemanticSearchSettings";
import { appVersion, buildDateLabel, releaseStage } from "@/lib/version";
import { InfoHint } from "@/components/InfoHint";
import { PlainButton } from "@/components/ui/plain-button";
import { Checkbox } from "@/components/ui/checkbox";

type Tab = "appearance" | "editor" | "ai" | "tasks" | "pages" | "shortcuts" | "about";
const TABS: { id: Tab; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "editor", label: "Editor" },
  { id: "ai", label: "AI" },
  { id: "tasks", label: "Tasks and time" },
  { id: "pages", label: "Pages and backup" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "about", label: "About" },
];

/** How long a change waits for the next one before it is saved (typing is not saved letter by letter). */
const SAVE_AFTER_MS = 500;

/** A section's title and one line about it. */
function Heading({ title, about }: { title: string; about: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{about}</p>
    </div>
  );
}

/** The languages offered for the AI's answers. */
const ANSWER_LANGUAGES = [
  "Danish",
  "English",
  "German",
  "Swedish",
  "Norwegian",
  "French",
  "Spanish",
];

export function SettingsContent({ stored, onClose }: { stored: Settings; onClose: () => void }) {
  const save = useSettingsStore((s) => s.save);
  const startOnLaunch = useUiStore((s) => s.startOnLaunch);
  const timeFormat = useUiStore((s) => s.timeFormat);
  const [draft, setDraftState] = useState<Settings>(() => structuredClone(stored));
  /** The newest draft, readable at once (a state is only new after the next draw). */
  const latest = useRef<Settings>(draft);
  /** What the settings file holds now, and what it held before the last change (for Undo). */
  const saved = useRef<Settings>(structuredClone(stored));
  const [undoTo, setUndoTo] = useState<Settings | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tab, setTab] = useState<Tab>(() => {
    const wanted = useUiStore.getState().settingsTab;
    if (wanted === "builtin") return "ai";
    return wanted === "vault" ? "pages" : "appearance";
  });
  const [providerId, setProviderId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  /** Saves the newest draft now. A change that cannot be saved is told and put back. */
  const persist = async (): Promise<boolean> => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const next = latest.current;
    if (JSON.stringify(next) === JSON.stringify(saved.current)) return true;
    const before = saved.current;
    try {
      // The backup is changed in its own part and saved at once; this copy may be older.
      const backups = useSettingsStore.getState().settings?.backups ?? next.backups;
      await save({ ...next, backups });
      saved.current = next;
      setUndoTo(before);
      return true;
    } catch (e) {
      reportError(e);
      latest.current = before;
      setDraftState(before);
      return false;
    }
  };
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const setDraft = (next: Settings): void => {
    latest.current = next;
    setDraftState(next);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void persistRef.current();
    }, SAVE_AFTER_MS);
  };
  // What is waiting to be saved is saved when the window goes away.
  useEffect(
    () => () => {
      if (timer.current !== null) void persistRef.current();
    },
    [],
  );
  const update = (patch: Partial<Settings>): void => {
    setDraft({ ...latest.current, ...patch });
  };
  const undo = async (): Promise<void> => {
    if (undoTo === null) return;
    const back = undoTo;
    try {
      const backups = useSettingsStore.getState().settings?.backups ?? back.backups;
      await save({ ...back, backups });
      saved.current = back;
      latest.current = back;
      setDraftState(back);
      setUndoTo(null);
    } catch (e) {
      reportError(e);
    }
  };
  const provider = draft.ai.providers.find((p) => p.id === providerId) ?? null;
  const providersPanel = (
    <div className="flex gap-4">
      <div className="flex w-44 shrink-0 flex-col gap-1">
        {draft.ai.providers
          .filter((p) => p.kind !== "builtin")
          .map((p) => (
            <PlainButton
              key={p.id}
              type="button"
              className={cn(
                "truncate rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                providerId === p.id && "bg-accent",
              )}
              onClick={() => {
                setProviderId(p.id);
              }}
            >
              {p.name}
              <span className="block text-[11px] text-muted-foreground">
                {effectiveLocation(p) === "local"
                  ? "local · Nexmio Work"
                  : p.kind === "anthropic"
                    ? "cloud · not used"
                    : "cloud · needs your OK"}
              </span>
            </PlainButton>
          ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAdding(true);
          }}
        >
          <Plus /> Add provider
        </Button>
      </div>
      <div className="min-w-0 flex-1">
        {provider ? (
          <ProviderEditor
            provider={provider}
            persist={persist}
            onChange={(p) => {
              setDraft({
                ...draft,
                ai: {
                  ...draft.ai,
                  providers: draft.ai.providers.map((x) => (x.id === p.id ? p : x)),
                },
              });
            }}
            onRemove={() => {
              const rest = draft.ai.providers.filter((x) => x.id !== provider.id);
              const firstLocal = rest.find((x) => effectiveLocation(x) === "local");
              setDraft({
                ...draft,
                ai: {
                  ...draft.ai,
                  providers: rest,
                  defaultProviderId:
                    draft.ai.defaultProviderId === provider.id
                      ? (firstLocal?.id ?? "")
                      : draft.ai.defaultProviderId,
                },
              });
              setProviderId(null);
            }}
          />
        ) : (
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>Choose a provider on the left to change it, or press Add provider.</p>
            <p>
              Nexmio Work only uses an AI that runs on this computer, so your pages never leave it.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const editor = draft.editor;
  const setEditor = (patch: Partial<Settings["editor"]>): void => {
    setDraft({ ...latest.current, editor: { ...latest.current.editor, ...patch } });
  };
  const shortcuts = HELP_TOPICS.find((t) => t.id === "shortcuts");

  return (
    <DialogContent className="h-[680px] max-w-5xl">
      <DialogHeader className="sr-only">
        <DialogTitle>Settings</DialogTitle>
        <DialogDescription>Application settings</DialogDescription>
      </DialogHeader>
      <div className="flex min-h-0 flex-1 gap-5">
        <nav className="flex w-48 shrink-0 flex-col gap-0.5" aria-label="Settings sections">
          <h2 className="px-2 pb-2 text-base font-semibold">Settings</h2>
          {TABS.map((t) => (
            <PlainButton
              key={t.id}
              type="button"
              aria-current={tab === t.id}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                tab === t.id &&
                  "bg-accent font-semibold text-accent-foreground shadow-[inset_2px_0_0_var(--primary)]",
              )}
              onClick={() => {
                setTab(t.id);
              }}
            >
              {t.label}
              {t.id === "ai" && <BetaBadge className="ml-1.5" />}
            </PlainButton>
          ))}
        </nav>
        <div className="min-h-0 flex-1 overflow-auto pr-1">
          {tab === "appearance" && (
            <div className="flex flex-col gap-4">
              <Heading title="Appearance" about="How Nexmio Work looks." />
              <ThemePicker
                value={draft.theme}
                onChange={(theme) => {
                  update({ theme });
                }}
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor="set-time">Time format</Label>
                <Select
                  id="set-time"
                  value={timeFormat}
                  onChange={(e) => {
                    useUiStore.getState().setTimeFormat(e.target.value as TimeFormat);
                  }}
                >
                  <option value="system">System ({resolveTimeFormat("system")}-hour)</option>
                  <option value="24">24-hour (14:30)</option>
                  <option value="12">12-hour (2:30 PM)</option>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={startOnLaunch}
                  onChange={(e) => {
                    useUiStore.getState().setStartOnLaunch(e.target.checked);
                  }}
                />
                Open the start page when Nexmio Work starts
              </label>
            </div>
          )}
          {tab === "editor" && (
            <div className="flex flex-col gap-4">
              <Heading title="Editor" about="How the text looks when you write and read." />
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline">
                      <Label htmlFor="set-font">Font size</Label>
                      <span className="ml-auto text-sm text-muted-foreground">
                        {editor.fontSize} px
                      </span>
                    </div>
                    <Slider
                      id="set-font"
                      min={10}
                      max={32}
                      value={editor.fontSize}
                      onChange={(e) => {
                        setEditor({ fontSize: Number(e.target.value) || 15 });
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline">
                      <Label htmlFor="set-width">Line width</Label>
                      <span className="ml-auto text-sm text-muted-foreground">
                        {editor.lineWidth} px
                      </span>
                    </div>
                    <Slider
                      id="set-width"
                      min={400}
                      max={2000}
                      step={20}
                      value={editor.lineWidth}
                      onChange={(e) => {
                        setEditor({ lineWidth: Number(e.target.value) || 760 });
                      }}
                    />
                  </div>
                  <ReadingSettings
                    editor={editor}
                    onChange={(next) => {
                      update({ editor: next });
                    }}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={editor.spellcheck}
                      onChange={(e) => {
                        setEditor({ spellcheck: e.target.checked });
                      }}
                    />
                    Spellcheck (the system's own, works without AI)
                  </label>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      className="mt-1"
                      checked={editor.aiSpelling}
                      onChange={(e) => {
                        setEditor({ aiSpelling: e.target.checked });
                      }}
                    />
                    <span>
                      Spelling help with the local AI
                      <span className="block text-xs text-muted-foreground">
                        A moment after you stop typing, the paragraph is checked and misspelt words
                        get a wavy line. Nothing changes until you click a word and choose. Made for
                        dyslexia. Needs a local AI; without one, the system spellcheck still works.
                      </span>
                    </span>
                  </label>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="own-words" className="text-sm">
                      My words (never marked), one per line
                    </label>
                    <Textarea
                      id="own-words"
                      rows={3}
                      className="rounded-md border bg-transparent px-2 py-1 text-sm"
                      value={editor.ownWords.join("\n")}
                      onChange={(e) => {
                        setEditor({ ownWords: e.target.value.split("\n") });
                      }}
                    />
                  </div>
                </div>
                <SettingsPreview editor={editor} />
              </div>
            </div>
          )}
          {tab === "ai" && (
            <div className="flex flex-col gap-3">
              <p className="rounded-md bg-warning/15 p-2.5 text-xs" data-testid="ai-beta-note">
                <BetaBadge className="mr-1.5" />
                The AI in Nexmio Work is still being built. It will change and can make mistakes.
                Everything else in Nexmio Work works without it.
              </p>
              <AiChoice
                draft={draft}
                onChange={setDraft}
                providersPanel={providersPanel}
                persist={persist}
              />
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  className="mt-1"
                  checked={draft.ai.checkAnswers}
                  onChange={(e) => {
                    update({ ai: { ...draft.ai, checkAnswers: e.target.checked } });
                  }}
                />
                <span>
                  Let the AI check its own answer before showing it
                  <span className="block text-xs text-muted-foreground">
                    For fix spelling, rewrite, translate and the other text commands. The AI is
                    asked once more whether the answer is only the finished text with the same
                    meaning, and tries again if it is not. Nexmio Work always throws away empty
                    answers and thinking out loud. Turning this on makes each answer take longer, so
                    it is best with a fast model.
                  </span>
                </span>
              </label>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="set-instr">About me and my pages</Label>
                  <InfoHint
                    label="About me and my pages"
                    text="Optional. The AI chat and skills read this so they know who you are and what your terms mean. The fixed commands (Fix, Rewrite, Shorten…) do not read it, because they do one thing."
                    topic="ai"
                  />
                </div>
                <Textarea
                  id="set-instr"
                  rows={5}
                  placeholder="For example: I work in IT security. “Wave 1” is the first group of users."
                  value={draft.ai.globalInstructions}
                  onChange={(e) => {
                    update({ ai: { ...draft.ai, globalInstructions: e.target.value } });
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="set-answer-language">Language of the AI's answers</Label>
                  <InfoHint
                    label="Language of the AI's answers"
                    text="Used by the chat, the fixed commands and the skills. “Same as the text” answers in the language of what you wrote. A Custom command that asks for a translation still decides its own language."
                    topic="ai"
                  />
                </div>
                <Select
                  id="set-answer-language"
                  value={draft.ai.answerLanguage}
                  onChange={(e) => {
                    update({ ai: { ...draft.ai, answerLanguage: e.target.value } });
                  }}
                >
                  <option value="">Same as the text</option>
                  {ANSWER_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                  {draft.ai.answerLanguage !== "" &&
                    !ANSWER_LANGUAGES.includes(draft.ai.answerLanguage) && (
                      <option value={draft.ai.answerLanguage}>{draft.ai.answerLanguage}</option>
                    )}
                </Select>
              </div>
              <SemanticSearchSettings draft={draft} onChange={setDraft} persist={persist} />
            </div>
          )}
          {tab === "tasks" && (
            <div className="flex flex-col gap-4">
              <Heading
                title="Tasks and time"
                about="What Nexmio Work does when you work on tasks."
              />
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  className="mt-1"
                  checked={editor.traceWork}
                  onChange={(e) => {
                    setEditor({ traceWork: e.target.checked });
                  }}
                />
                <span>
                  Trace my work in today's daily page
                  <span className="block text-xs text-muted-foreground">
                    Nexmio Work writes one short line under “Worked on” for each page you write in
                    and each task you make, work on or finish, once a day. You can edit or remove
                    the lines, and write there yourself. No AI is used.
                  </span>
                </span>
              </label>
            </div>
          )}
          {tab === "pages" && (
            <div className="flex flex-col gap-4">
              <Heading
                title="Pages and backup"
                about="Your vault, its backup and the history of every change."
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="set-recent">Recent pages shown</Label>
                  <InfoHint
                    label="Recent pages"
                    text="How many of the pages you opened last are listed under Recent in the file panel. Choose 0 to hide the list."
                    topic="start"
                  />
                </div>
                <Input
                  data-no-ai
                  id="set-recent"
                  type="number"
                  min={0}
                  max={20}
                  value={editor.recentNotes}
                  onChange={(e) => {
                    const n = Math.round(Number(e.target.value));
                    setEditor({
                      recentNotes: Number.isFinite(n) ? Math.min(20, Math.max(0, n)) : 4,
                    });
                  }}
                />
              </div>
              <TaskbarHelperSettings
                helper={draft.helper}
                onChange={(helper) => {
                  update({ helper });
                }}
              />
              <VaultSettingsTab />
              <fieldset className="flex flex-col gap-3 border-t pt-4">
                <legend className="text-sm font-medium">Version history</legend>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="set-author">Author name</Label>
                  <Input
                    data-no-ai
                    id="set-author"
                    value={draft.git.authorName}
                    onChange={(e) => {
                      update({ git: { ...draft.git, authorName: e.target.value } });
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="set-email">Author email</Label>
                  <Input
                    data-no-ai
                    id="set-email"
                    value={draft.git.authorEmail}
                    onChange={(e) => {
                      update({ git: { ...draft.git, authorEmail: e.target.value } });
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="set-idle">Commit after idle (minutes, 1–60)</Label>
                    <InfoHint
                      label="Idle commit"
                      text="If you have unsaved changes and stop working, Nexmio Work saves a version of your pages in the history after this many minutes."
                      topic="history"
                    />
                  </div>
                  <Input
                    data-no-ai
                    id="set-idle"
                    type="number"
                    min={1}
                    max={60}
                    value={draft.git.idleCommitMinutes}
                    onChange={(e) => {
                      const n = Math.min(60, Math.max(1, Number(e.target.value) || 5));
                      update({ git: { ...draft.git, idleCommitMinutes: n } });
                    }}
                  />
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    className="mt-1"
                    checked={draft.git.commitOnClose}
                    onChange={(e) => {
                      update({ git: { ...draft.git, commitOnClose: e.target.checked } });
                    }}
                  />
                  <span>
                    Save a version when I close a page
                    <span className="block text-xs text-muted-foreground">
                      The same as pressing Ctrl+S for that page.
                    </span>
                  </span>
                </label>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="set-every">Save a version every (minutes, 0 = never)</Label>
                  <Input
                    data-no-ai
                    id="set-every"
                    type="number"
                    min={0}
                    max={240}
                    value={draft.git.commitEveryMinutes}
                    onChange={(e) => {
                      const n = Math.min(240, Math.max(0, Number(e.target.value) || 0));
                      update({ git: { ...draft.git, commitEveryMinutes: n } });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    While you write, a version of what changed is saved this often. It is on top of
                    the version saved after you stop.
                  </p>
                </div>
              </fieldset>
            </div>
          )}
          {tab === "shortcuts" && (
            <div className="flex flex-col gap-3">
              <Heading title="Shortcuts" about="The keys that do things in Nexmio Work." />
              {shortcuts && <MarkdownText text={shortcuts.body} />}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    useUiStore.getState().openHelp("shortcuts");
                  }}
                >
                  Open the guide
                </Button>
              </div>
            </div>
          )}
          {tab === "about" && (
            <div className="flex flex-col gap-3">
              <Heading title="About" about="Nexmio Work, part of Nexmio." />
              <p className="text-sm">
                Nexmio Work version {appVersion} ({releaseStage}) · built {buildDateLabel()}
              </p>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    useUiStore.getState().setAboutOpen(true);
                  }}
                >
                  About Nexmio Work…
                </Button>
              </div>
              <h3 className="section-label mt-2">For troubleshooting</h3>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  className="mt-1"
                  checked={draft.debugMode}
                  onChange={(e) => {
                    update({ debugMode: e.target.checked });
                  }}
                />
                <span>
                  Debug mode
                  <span className="block text-xs text-muted-foreground">
                    Adds "Inspect element" to every right-click menu, so a problem can be looked
                    into. Leave it off in daily use.
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
      <DialogFooter className="items-center sm:justify-between">
        <span className="text-xs text-muted-foreground">Changes apply at once.</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={undoTo === null}
            onClick={() => {
              void undo();
            }}
          >
            Undo the last change
          </Button>
          <Button
            onClick={() => {
              void persist().then(() => {
                onClose();
              });
            }}
          >
            Close
          </Button>
        </div>
      </DialogFooter>
      <AddProviderDialog
        open={adding}
        onCancel={() => {
          setAdding(false);
        }}
        onAdd={(p) => {
          setDraft({ ...draft, ai: { ...draft.ai, providers: [...draft.ai.providers, p] } });
          setProviderId(p.id);
          setAdding(false);
        }}
      />
    </DialogContent>
  );
}
