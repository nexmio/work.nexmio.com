# Editor

The page editor (CodeMirror 6): live preview (`extensions/livePreview.ts`, markers hidden off the cursor line, tables, images, Mermaid), wiki-links and tags with suggestions, the toolbar, the `···` page menu (`NoteMenu`), Tab/Shift+Tab (`extensions/listIndent.ts`), pasting images, and the page panels on the right (outline, links, images).

- Edits are written to disk after 1 s (`useNoteSession`); commits happen elsewhere (History). Flush pending writes (`flushPendingWrites`) before anything else reads or writes the page.
- The editor shows Markdown; it never changes a page's text on its own except what the person types or a command they chose.
- `MarkdownField` (`MarkdownField.tsx`) is the editor in a small box, used by every multi-line page field in the other areas; it is the one deliberate public part of this area. A change to how pages are written in boxes is made there.
- Indent rules are shared with every text box for pages (`src/lib/indentText.ts`); change both together.
