import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SearchHit } from "@/bindings/SearchHit";
import type { TagCount } from "@/bindings/TagCount";
import { isSystemTag, NOTE_TAGS } from "@/lib/noteTags";
import { Input } from "@/components/ui/input";
import { api, toApiError } from "@/lib/api";
import { openFile } from "@/lib/actions";
import { renderSnippet } from "@/lib/snippet";
import { cn } from "@/lib/utils";
import { useEmbeddingStore } from "@/stores/embeddingStore";
import { noteName, taskHasTag, usedTags } from "@/lib/taskLogic";
import { useTaskStore } from "@/stores/taskStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { InfoHint } from "@/components/InfoHint";
import { PanelHeader } from "@/components/PanelHeader";
import { looksLikeQuestion } from "@/lib/question";
import { useAiBlocked } from "@/lib/useAiBlocked";
import { AnswerCard } from "./AnswerCard";
import { isManagedNote } from "@/features/fileTree/treeUtils";
import { PlainButton } from "@/components/ui/plain-button";

/** How many tasks a tag search lists. */
const TASKS_SHOWN = 50;

type Mode = "keyword" | "meaning" | "both";
const MODES: { id: Mode; label: string }[] = [
  { id: "keyword", label: "Keyword" },
  { id: "meaning", label: "Meaning" },
  { id: "both", label: "Both" },
];

/**
 * Full-text search with live results. Keyword mode uses the FTS index; Meaning and Both use
 * embeddings (when semantic search is on). `tag:` and `path:` always use keyword filters.
 */
export function SearchPanel() {
  const seed = useUiStore((s) => s.searchSeed);
  const focusNonce = useUiStore((s) => s.focusSearchNonce);
  const indexNonce = useVaultStore((s) => s.indexNonce);
  const status = useEmbeddingStore((s) => s.status);
  const semanticReady = status?.enabled === true && status.chunks > 0;
  const aiOff = useAiBlocked();
  const [mode, setMode] = useState<Mode>("keyword");
  const [text, setText] = useState(seed);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [tags, setTags] = useState<TagCount[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [tagHitPaths, setTagHitPaths] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const allTasks = useTaskStore((s) => s.tasks);
  const allEpics = useTaskStore((s) => s.epics);
  // A single word that is a tag you use counts as searching for that tag, with or without `tag:`.
  const word = text.trim().replace(/^#/, "").toLowerCase();
  const typedTag =
    /^[^\s:]+$/.test(word) &&
    (tags.some((t) => t.tag === word) || usedTags(allTasks, allEpics).includes(word))
      ? word
      : null;
  // `tag:name` finds the tasks that have the tag too (their own, or from their epic).
  const wanted = /(?:^|\s)tag:#?(\S+)/.exec(text)?.[1]?.toLowerCase() ?? typedTag;
  const tagPaths = new Set(tagHitPaths);
  const tagged =
    wanted === null
      ? []
      : allTasks.filter((t) => taskHasTag(t, allEpics, wanted)).slice(0, TASKS_SHOWN);
  // A page that is an epic has the tag only on its tasks: those are listed as tasks, and open as
  // tasks, so the page itself is not listed a second time.
  const shownHits = hits
    .filter((h) => !isManagedNote(h.path))
    .filter((h) => {
      if (wanted === null) return true;
      const epic = allEpics.find((e) => e.path === h.path);
      return (
        epic === undefined || epic.tags.includes(wanted) || !tagged.some((t) => t.path === h.path)
      );
    });

  useEffect(() => {
    setText(seed);
  }, [seed, focusNonce]);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, [focusNonce]);

  useEffect(() => {
    api
      .allTags()
      .then(setTags)
      .catch(() => undefined);
  }, [indexNonce]);

  useEffect(() => {
    if (text.trim() === "") {
      setHits([]);
      setSearched(false);
      setPending(false);
      setNotice(null);
      return;
    }
    const filtered = /(^|\s)(tag|path):/.test(text);
    const effective: Mode = !semanticReady || filtered ? "keyword" : mode;
    const delay = effective === "keyword" ? 200 : 500;
    setPending(true);
    let cancelled = false;
    const t = setTimeout(() => {
      const run = async (): Promise<void> => {
        if (effective === "keyword") {
          const h = await api.search({ text, tag: null, folder: null });
          // A word that is a tag finds what has the tag as well as what says the word.
          const byTag =
            typedTag === null
              ? []
              : await api.search({ text: `tag:${typedTag}`, tag: null, folder: null });
          const merged = [...byTag, ...h.filter((x) => !byTag.some((y) => y.path === x.path))];
          if (!cancelled) {
            setTagHitPaths(
              /(^|\s)tag:/.test(text) ? merged.map((x) => x.path) : byTag.map((x) => x.path),
            );
            setHits(merged);
          }
        } else if (effective === "meaning") {
          const h = await api.semanticSearch(text.trim());
          if (!cancelled)
            setHits(h.map((x) => ({ path: x.path, title: x.title, snippet: x.snippet })));
        } else {
          const h = await api.hybridSearch(text);
          if (!cancelled) setHits(h);
        }
        if (!cancelled) setNotice(null);
      };
      run()
        .catch(async (e: unknown) => {
          if (cancelled) return;
          // Semantic search is unavailable (for example the model server is off): keep keyword results.
          setNotice(`Semantic search is unavailable: ${toApiError(e).message}`);
          try {
            setHits(await api.search({ text, tag: null, folder: null }));
          } catch (inner) {
            reportError(inner);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearched(true);
            setPending(false);
          }
        });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [text, indexNonce, mode, semanticReady, typedTag]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title="Search" />
      <div className="relative p-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-no-ai
          ref={input}
          aria-label="Search pages"
          className="pl-7"
          placeholder="Search…  (tag:name  path:folder)"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          }}
        />
      </div>
      {semanticReady && (
        <div className="mx-2 mb-1 flex items-center gap-1.5">
          <div
            role="radiogroup"
            aria-label="Search mode"
            className="flex flex-1 overflow-hidden rounded-md border text-xs"
          >
            {MODES.map((m) => (
              <PlainButton
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                className={cn(
                  "flex-1 px-2 py-1",
                  mode === m.id ? "bg-accent font-medium" : "hover:bg-muted",
                )}
                onClick={() => {
                  setMode(m.id);
                }}
              >
                {m.label}
              </PlainButton>
            ))}
          </div>
          <InfoHint
            label="Search mode"
            text="Keyword finds the words you type. Meaning finds pages about the same thing in other words. Both combines them."
            topic="search"
          />
        </div>
      )}
      {status?.state === "indexing" && (
        <p className="mx-2 mb-1 text-[11px] text-muted-foreground">
          Indexing {status.notesDone}/{status.notesTotal} pages… results may be incomplete.
        </p>
      )}
      {notice && (
        <p role="status" className="mx-2 mb-1 text-[11px] text-destructive">
          {notice}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
        {text.trim() === "" && tags.length > 0 && (
          <div className="flex flex-col gap-3">
            {[
              { title: "Your tags", list: tags.filter((t) => !isSystemTag(t.tag)), system: false },
              {
                title: "Nexmio Work's tags",
                list: tags.filter((t) => isSystemTag(t.tag)),
                system: true,
              },
            ]
              .filter((g) => g.list.length > 0)
              .map((g) => (
                <div key={g.title}>
                  <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">{g.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {g.list.map((t) => (
                      <PlainButton
                        key={t.tag}
                        type="button"
                        title={NOTE_TAGS.find((n) => n.tag === t.tag)?.does}
                        className={
                          g.system
                            ? "rounded-full border border-primary/30 bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground hover:opacity-80"
                            : "rounded-full border bg-background px-2 py-0.5 text-xs hover:bg-accent"
                        }
                        onClick={() => {
                          setText(`tag:${t.tag}`);
                        }}
                      >
                        {g.system
                          ? (NOTE_TAGS.find((n) => n.tag === t.tag)?.label ?? t.tag)
                          : `#${t.tag}`}{" "}
                        <span className="opacity-60">{t.count}</span>
                      </PlainButton>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
        {aiOff === null && looksLikeQuestion(text) && (
          <AnswerCard question={text.trim()} semantic={semanticReady} />
        )}
        {pending && text.trim() !== "" && (
          <p className="p-2 text-xs text-muted-foreground">Searching…</p>
        )}
        {searched && !pending && shownHits.length === 0 && tagged.length === 0 && (
          <p className="p-2 text-xs text-muted-foreground">No results.</p>
        )}
        {tagged.length > 0 && (
          <section aria-label="Tasks with this tag" className="pb-2">
            <h3 className="section-label px-1 pb-1">Tasks</h3>
            <ul>
              {tagged.map((t) => (
                <li key={`${t.path}:${String(t.line)}`}>
                  <PlainButton
                    type="button"
                    className="w-full rounded px-2 py-1.5 text-left hover:bg-muted"
                    onClick={() => {
                      useTaskStore.getState().open(t);
                    }}
                  >
                    <div className="truncate text-[13px] font-medium">{t.title}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {noteName(t.path)} ·{" "}
                      {t.tags.includes(wanted ?? "")
                        ? `has the tag #${wanted ?? ""}`
                        : `the epic has #${wanted ?? ""}`}
                    </div>
                  </PlainButton>
                </li>
              ))}
            </ul>
          </section>
        )}
        <ul>
          {shownHits.map((h) => (
            <li key={h.path}>
              <PlainButton
                type="button"
                className="w-full rounded px-2 py-1.5 text-left hover:bg-muted"
                onClick={() => {
                  void openFile(h.path);
                }}
              >
                <div className="truncate text-[13px] font-medium">{h.title}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {h.path}
                  {wanted !== null && tagPaths.has(h.path) && ` · has the tag #${wanted}`}
                </div>
                {h.snippet !== "" && (
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {renderSnippet(h.snippet)}
                  </div>
                )}
              </PlainButton>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
