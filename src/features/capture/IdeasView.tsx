import { Archive, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import type { Idea } from "@/bindings/Idea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlainButton } from "@/components/ui/plain-button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownField } from "@/features/editor/MarkdownField";
import { api } from "@/lib/api";
import { fileNameFrom } from "@/lib/noteTitle";
import { shortDate, stepsFromAnswer, todayIso } from "@/lib/taskLogic";
import { AiAsk } from "@/components/AiAsk";
import { ChooseEpicDialog } from "./ChooseEpicDialog";
import { DeleteButton } from "@/components/DeleteButton";
import { ViewHeader } from "@/components/ViewHeader";
import { useIdeaStore } from "@/stores/ideaStore";
import { useTaskStore } from "@/stores/taskStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

/** Turns an idea into a task in the epic at `epicPath`. The idea stays, marked as used. */
export async function ideaToTask(idea: Idea, epicPath: string): Promise<void> {
  await useTaskStore
    .getState()
    .add(`${idea.text}${idea.tags.map((t) => ` #${t}`).join("")}`, idea.note, undefined, epicPath);
  await useIdeaStore.getState().setStatus(idea, "used");
  useUiStore.getState().toast("Made a task.", "success");
}

/** Turns an idea into a note in Quick notes and opens it. The idea stays, marked as used. */
export async function ideaToNote(idea: Idea): Promise<void> {
  try {
    const vault = useVaultStore.getState();
    const folder = vault.vault?.config.quickNotesFolder ?? "";
    const title = idea.text.length > 60 ? `${idea.text.slice(0, 57)}…` : idea.text;
    const path = await api.createNote(folder, fileNameFrom(title));
    await api.writeNote(
      path,
      `# ${title}\n\n${idea.text}\n${idea.note === "" ? "" : `\n${idea.note}\n`}`,
    );
    await vault.refreshTree();
    await useIdeaStore.getState().setStatus(idea, "used");
    await vault.openNote(path);
  } catch (e) {
    reportError(e);
  }
}

const THINK_INSTRUCTION =
  "Ask three short questions that help the person think this idea through: who it is for, what it should do, and what is needed to start. Number them 1, 2, 3. Do not answer them. Write in the language of the idea.";

const STEPS_INSTRUCTION =
  "Suggest three to five small, concrete first steps to get started with this idea. Write each step as one short line that starts with '- ' and a verb. Write in the language of the idea. Answer with the list only.";

/** The idea as it is written in the title box: the text, then its #tags. */
function titleOf(idea: Idea): string {
  return `${idea.text}${idea.tags.map((t) => ` #${t}`).join("")}`;
}

/** One idea, open for reading and changing. It is saved when you leave a box or press Save. */
function IdeaEditor({ idea }: { idea: Idea }) {
  const [title, setTitle] = useState(titleOf(idea));
  const [note, setNote] = useState(idea.note);
  const today = todayIso();
  // What waits for an epic to be chosen: the idea itself, or the steps the AI suggested.
  const [asking, setAsking] = useState<((epic: string) => Promise<void>) | null>(null);
  const dirty = title !== titleOf(idea) || note !== idea.note;

  useEffect(() => {
    setTitle(titleOf(idea));
    setNote(idea.note);
    // Only when the idea itself was changed, not on every reload of the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea.key, idea.note]);

  const save = async (): Promise<void> => {
    if (!dirty) return;
    if (title.trim() === "") {
      setTitle(titleOf(idea));
      return;
    }
    await useIdeaStore.getState().edit(idea, title, note);
  };
  const set = useIdeaStore.getState().setStatus;
  const open = idea.status === null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Written {idea.date === today ? "today" : shortDate(idea.date)}</span>
        {idea.status === "used" && (
          <span className="rounded-full border px-2">Turned into something</span>
        )}
        {idea.status === "archived" && <span className="rounded-full border px-2">Archived</span>}
      </div>
      <Input
        aria-label="The idea"
        className="h-11 text-base font-semibold"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
        }}
        onBlur={() => {
          void save();
        }}
      />
      <MarkdownField
        label="Note for the idea"
        rows={10}
        maxRows={40}
        placeholder="A note for the idea. Write what you were thinking, links, next steps… It is saved when you click away."
        value={note}
        onChange={setNote}
        onBlur={() => {
          void save();
        }}
        submitKey="mod-enter"
        onSubmit={() => {
          void save();
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        {open && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                void save().then(() => {
                  setAsking(() => (epic: string) => ideaToTask(idea, epic));
                });
              }}
            >
              Make a task
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void save().then(() => ideaToNote(idea));
              }}
            >
              Make a page
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                void set(idea, "archived");
              }}
            >
              <Archive /> Archive
            </Button>
          </>
        )}
        {!open && (
          <Button
            variant="outline"
            onClick={() => {
              void set(idea, null);
            }}
          >
            Bring back
          </Button>
        )}
        <DeleteButton
          what="this idea"
          where="open the page Ideas and choose History to bring it back."
          onDelete={() => {
            void useIdeaStore.getState().remove(idea);
          }}
        />
        <span className="grow" />
        <Button disabled={!dirty} onClick={() => void save()}>
          Save
        </Button>
      </div>
      {open && (
        <div className="flex flex-col gap-3 border-t pt-4">
          <AiAsk
            label="Think it through"
            title="Questions to think about"
            notePath={null}
            instruction={THINK_INSTRUCTION}
            text={() => `${title}\n\n${note}`}
            actions={(answer, close) => (
              <Button
                size="sm"
                onClick={() => {
                  const next = `${note.trim()}${note.trim() === "" ? "" : "\n\n"}${answer}`;
                  setNote(next);
                  void useIdeaStore.getState().edit(idea, title, next);
                  close();
                }}
              >
                Add to the idea's note
              </Button>
            )}
          />
          <AiAsk
            label="Suggest first steps"
            title="First steps"
            notePath={null}
            instruction={STEPS_INSTRUCTION}
            text={() => `${title}\n\n${note}`}
            actions={(answer, close) => {
              const steps = stepsFromAnswer(answer);
              return (
                <Button
                  size="sm"
                  disabled={steps.length === 0}
                  onClick={() => {
                    // One task with the steps under it, not one task for each step.
                    setAsking(() => async (epic: string) => {
                      await useTaskStore
                        .getState()
                        .add(title.replace(/#\S+/g, "").trim(), "", steps, epic);
                      useUiStore
                        .getState()
                        .toast(`Made one task with ${String(steps.length)} steps.`, "success");
                      close();
                    });
                  }}
                >
                  Make a task with {steps.length} steps
                </Button>
              );
            }}
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        An idea you turn into a task or a page stays here, marked as used, so nothing is lost. The
        page you write here goes with it.
      </p>
      {asking !== null && (
        <ChooseEpicDialog
          title="Make a task"
          onCancel={() => {
            setAsking(null);
          }}
          onChoose={(epic) => {
            const run = asking;
            setAsking(null);
            void run(epic);
          }}
        />
      )}
    </div>
  );
}

const COLUMNS: { id: "open" | "used" | "archived"; label: string; empty: string }[] = [
  { id: "open", label: "Open", empty: "Ideas you write down wait here." },
  { id: "used", label: "Used", empty: "An idea you turn into something moves here." },
  { id: "archived", label: "Archived", empty: "Ideas you put away are here." },
];

/** One idea as a card: all of its words, its note, and what it can become. */
function IdeaCard({
  idea,
  onTask,
  onDelete,
}: {
  idea: Idea;
  onTask: () => void;
  onDelete: () => void;
}) {
  const today = todayIso();
  const open = idea.status === null;
  return (
    <li className="flex flex-col gap-2 rounded-xl border bg-card p-3">
      <PlainButton
        type="button"
        className="text-left text-base font-semibold leading-snug focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => {
          useIdeaStore.getState().select(idea.line);
        }}
      >
        {idea.text}
      </PlainButton>
      {idea.note !== "" && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {idea.note}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {idea.tags.map((t) => (
          <span key={t} className="rounded-full bg-muted px-2 py-0.5">
            #{t}
          </span>
        ))}
        {idea.status === "used" && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
            Turned into something
          </span>
        )}
        <span className="ml-auto">{idea.date === today ? "Today" : shortDate(idea.date)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {open && (
          <>
            <Button size="sm" variant="outline" onClick={onTask}>
              To task
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void ideaToNote(idea);
              }}
            >
              To page
            </Button>
          </>
        )}
        {!open && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void useIdeaStore.getState().setStatus(idea, null);
            }}
          >
            Open again
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto size-8"
              aria-label={`More for the idea ${idea.text}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                useIdeaStore.getState().select(idea.line);
              }}
            >
              Edit
            </DropdownMenuItem>
            {open && (
              <DropdownMenuItem
                onSelect={() => {
                  void useIdeaStore.getState().setStatus(idea, "archived");
                }}
              >
                Archive
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onDelete}>Delete…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

/** The ideas as three columns of cards: Open, Used and Archived, with one line to write a new one. */
function IdeasBoard() {
  const ideas = useIdeaStore((s) => s.ideas);
  const [text, setText] = useState("");
  const [asking, setAsking] = useState<Idea | null>(null);
  const [deleting, setDeleting] = useState<Idea | null>(null);
  const inColumn = (id: "open" | "used" | "archived"): Idea[] =>
    ideas.filter((i) => (id === "open" ? i.status === null : i.status === id));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4">
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = text.trim();
          if (value === "") return;
          setText("");
          void useIdeaStore.getState().add(value);
        }}
      >
        <Input
          aria-label="Write an idea"
          className="h-10 text-base"
          placeholder="Write an idea… Enter saves"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
        />
        <Button type="submit" disabled={text.trim() === ""}>
          Save
        </Button>
      </form>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((c) => {
          const list = inColumn(c.id);
          return (
            <section key={c.id} aria-label={c.label} className="flex min-w-0 flex-col gap-2">
              <h3 className="section-label flex items-center gap-2 px-1">
                {c.label}
                <span className="rounded-full bg-muted px-2 text-xs">{list.length}</span>
              </h3>
              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {c.empty}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {list.map((i) => (
                    <IdeaCard
                      key={i.line}
                      idea={i}
                      onTask={() => {
                        setAsking(i);
                      }}
                      onDelete={() => {
                        setDeleting(i);
                      }}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      {asking !== null && (
        <ChooseEpicDialog
          title="Make a task"
          onCancel={() => {
            setAsking(null);
          }}
          onChoose={(epic) => {
            const idea = asking;
            setAsking(null);
            void ideaToTask(idea, epic);
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this idea?"
        description="It stays in the version history of the page Ideas, so it can be brought back."
        confirmLabel="Delete"
        destructive
        onCancel={() => {
          setDeleting(null);
        }}
        onConfirm={() => {
          const idea = deleting;
          setDeleting(null);
          if (idea !== null) void useIdeaStore.getState().remove(idea);
        }}
      />
    </div>
  );
}

/** The Ideas area: the idea picked in the list on the left, or a box to write a new one. */
export function IdeasView() {
  const ideas = useIdeaStore((s) => s.ideas);
  const selected = useIdeaStore((s) => s.selectedLine);
  const picked = ideas.find((i) => i.line === selected);

  useEffect(() => {
    void useIdeaStore.getState().load();
  }, []);

  return (
    <section aria-label="Ideas" className="flex h-full min-h-0 flex-col bg-background">
      <ViewHeader
        title={picked ? "Idea" : "Ideas"}
        back={
          picked
            ? {
                label: "Ideas",
                run: () => {
                  useIdeaStore.getState().select(null);
                },
              }
            : undefined
        }
      >
        {picked ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              useIdeaStore.getState().select(null);
            }}
          >
            New idea
          </Button>
        ) : (
          <span className="hidden text-sm text-muted-foreground md:inline">
            A place for thoughts that have not become anything yet
          </span>
        )}
      </ViewHeader>
      <div className="min-h-0 flex-1 overflow-auto">
        {picked ? <IdeaEditor key={picked.line} idea={picked} /> : <IdeasBoard />}
      </div>
    </section>
  );
}
