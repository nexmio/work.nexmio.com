import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PlainButton } from "@/components/ui/plain-button";

/** A tag of the vault and how many pages use it, for the suggestions. */
export interface TagSuggestion {
  tag: string;
  count: number;
}

/** How many suggestions are shown at a time. */
const OFFERED = 6;

/** The tag as pages keep it: no `#`, lower case, letters, digits, `_` and `-`, with a letter in it. */
export function cleanTag(raw: string): string | null {
  const t = raw.trim().replace(/^#+/, "").toLowerCase();
  return /^[\p{L}\p{N}_-]*\p{L}[\p{L}\p{N}_-]*$/u.test(t) ? t : null;
}

/**
 * The tags of a task, an epic or anything else that has them: the tags it has itself (with a
 * cross that takes one off), the tags it gets from something around it (dashed, no cross), and a
 * small field that adds one. Tags used on pages are offered as you type, because they are the same
 * tags everywhere.
 */
export function TagPicker({
  tags,
  inherited = [],
  inheritedFrom = "the epic",
  suggestions,
  onAdd,
  onRemove,
}: {
  tags: readonly string[];
  inherited?: readonly string[];
  /** What the inherited tags come from, for the tooltip. */
  inheritedFrom?: string;
  suggestions: readonly TagSuggestion[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [problem, setProblem] = useState(false);

  const typed = text.trim().replace(/^#+/, "").toLowerCase();
  const offered = suggestions
    .filter(
      (s) =>
        !tags.includes(s.tag) &&
        !inherited.includes(s.tag) &&
        s.tag.toLowerCase().startsWith(typed),
    )
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, OFFERED);

  const close = (): void => {
    setAdding(false);
    setText("");
    setProblem(false);
  };
  const add = (raw: string): void => {
    const tag = cleanTag(raw);
    if (tag === null) {
      setProblem(true);
      return;
    }
    if (!tags.includes(tag)) onAdd(tag);
    close();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <ul aria-label="Tags" className="flex flex-wrap items-center gap-1.5">
        {inherited
          .filter((t) => !tags.includes(t))
          .map((t) => (
            <li
              key={`i-${t}`}
              title={`From ${inheritedFrom}`}
              className="inline-flex items-center rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              #{t}
            </li>
          ))}
        {tags.map((t) => (
          <li
            key={t}
            className="inline-flex items-center gap-1 rounded-full border bg-accent py-0.5 pl-2.5 pr-1 text-xs text-accent-foreground"
          >
            #{t}
            <PlainButton
              type="button"
              aria-label={`Take the tag ${t} off`}
              className="rounded-full p-0.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                onRemove(t);
              }}
            >
              <X className="size-3" aria-hidden />
            </PlainButton>
          </li>
        ))}
        {!adding && (
          <li>
            <PlainButton
              type="button"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                setAdding(true);
              }}
            >
              <Plus className="size-3" aria-hidden /> Add a tag
            </PlainButton>
          </li>
        )}
      </ul>
      {adding && (
        <form
          className="flex flex-col gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            add(text);
          }}
        >
          <Input
            autoFocus
            aria-label="New tag"
            aria-invalid={problem}
            placeholder="A tag, then Enter"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setProblem(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                close();
              }
            }}
          />
          {problem && (
            <p role="alert" className="text-xs text-destructive">
              A tag is one word: letters, digits, - and _.
            </p>
          )}
          {offered.length > 0 && (
            <ul aria-label="Tags you already use" className="flex flex-wrap gap-1.5">
              {offered.map((s) => (
                <li key={s.tag}>
                  <PlainButton
                    type="button"
                    className="rounded-full border px-2.5 py-0.5 text-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      add(s.tag);
                    }}
                  >
                    #{s.tag}
                    <span className="ml-1 text-muted-foreground">· {s.count}</span>
                  </PlainButton>
                </li>
              ))}
            </ul>
          )}
        </form>
      )}
    </div>
  );
}
