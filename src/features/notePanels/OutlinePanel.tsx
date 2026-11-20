import { useMemo } from "react";
import { goToLine } from "@/lib/editorViews";
import { outlineOf } from "@/lib/outline";
import { useNoteText } from "./useNoteText";
import { PlainButton } from "@/components/ui/plain-button";

/** The headings of the open note. Click one to go there. (Its tags are in the row above the text.) */
export function OutlinePanel() {
  const { path, text } = useNoteText();
  const headings = useMemo(() => outlineOf(text), [text]);
  const top = Math.min(...headings.map((h) => h.level), 6);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {path === null && <p className="px-2 text-xs text-muted-foreground">No page open.</p>}
        {path !== null && headings.length === 0 && (
          <p className="px-2 text-xs text-muted-foreground">
            This page has no headings. Start a line with # to make one.
          </p>
        )}
        <ul>
          {headings.map((h) => (
            <li key={h.line}>
              <PlainButton
                type="button"
                className="w-full truncate rounded-md py-1 pr-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                style={{ paddingLeft: `${String(8 + (h.level - top) * 14)}px` }}
                onClick={() => {
                  goToLine(h.line);
                }}
              >
                {h.text}
              </PlainButton>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
