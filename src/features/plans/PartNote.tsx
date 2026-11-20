import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * The short note of a part: shown as text, and written in a box after "Write a note" or
 * "Change". It is kept in the plan's page under the part's line, so no page has to be made for it.
 */
export function PartNote({
  note,
  onSave,
  startOpen = false,
  onDone,
}: {
  note: string;
  onSave: (text: string) => void;
  /** Opens with the box to write in (the window from the outline). */
  startOpen?: boolean;
  /** Called after Save or Cancel. */
  onDone?: () => void;
}) {
  const [writing, setWriting] = useState(startOpen);
  const [text, setText] = useState(note);
  const box = useRef<HTMLTextAreaElement>(null);
  // Opened from a menu: the menu gives the focus back to where it was when it closes, so the
  // cursor is put in the box once that has happened.
  useEffect(() => {
    if (!startOpen) return;
    const t = setTimeout(() => {
      box.current?.focus();
    }, 50);
    return () => {
      clearTimeout(t);
    };
  }, [startOpen]);
  const stop = (): void => {
    setWriting(false);
    onDone?.();
  };
  if (!writing) {
    return note === "" ? (
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => {
          setText("");
          setWriting(true);
        }}
      >
        <Pencil /> Write a note
      </Button>
    ) : (
      <div className="flex flex-col gap-1">
        <p className="whitespace-pre-wrap rounded-md bg-muted px-2.5 py-1.5 text-sm">{note}</p>
        <Button
          size="sm"
          variant="ghost"
          className="self-start"
          onClick={() => {
            setText(note);
            setWriting(true);
          }}
        >
          <Pencil /> Change the note
        </Button>
      </div>
    );
  }
  return (
    <form
      className="flex flex-col gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(text);
        stop();
      }}
    >
      <Textarea
        ref={box}
        autoFocus
        aria-label="Note about this part"
        placeholder="A few words about what this part is for"
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            stop();
          }
        }}
      />
      <div className="flex justify-end gap-1.5">
        <Button type="button" size="sm" variant="ghost" onClick={stop}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Save the note
        </Button>
      </div>
    </form>
  );
}
