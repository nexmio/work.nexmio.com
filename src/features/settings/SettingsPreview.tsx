import type { EditorSettings } from "@/bindings/EditorSettings";
import { LETTER_SPACINGS, LINE_SPACINGS, TEXT_FONTS } from "@/lib/reading";

/** The value of the choice with this id (the first one for a word that is not known). */
function valueOf(list: readonly { id: string; value: string }[], id: string): string {
  return (list.find((x) => x.id === id) ?? list[0])?.value ?? "";
}

/**
 * A small page that shows the editor choices while they are changed: the font, its size, the space
 * between lines and letters and how wide the text may be. It reads the draft, so it follows a slider
 * while it is dragged.
 */
export function SettingsPreview({ editor }: { editor: EditorSettings }) {
  return (
    <div
      aria-label="Preview"
      className="flex flex-col gap-2 overflow-auto rounded-xl border bg-card p-4"
    >
      <span className="section-label">Preview</span>
      <div
        className="flex flex-col gap-2"
        style={{
          maxWidth: `${String(editor.lineWidth)}px`,
          fontFamily: valueOf(TEXT_FONTS, editor.textFont),
          lineHeight: valueOf(LINE_SPACINGS, editor.lineSpacing),
          letterSpacing: valueOf(LETTER_SPACINGS, editor.letterSpacing),
          fontSize: `${String(editor.fontSize)}px`,
        }}
      >
        <h3 style={{ fontSize: "1.3em", fontWeight: 700 }}>VPN rollout plan</h3>
        <p>We roll out the new VPN client to all laptops before the end of November.</p>
        <p className="text-muted-foreground">
          - Everyone is on the new client by 30 November.
          <br />- The old client is removed afterwards.
        </p>
      </div>
    </div>
  );
}
