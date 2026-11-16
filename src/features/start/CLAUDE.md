# Start page

The start page (the house): widgets the person arranges with Customize (`src/lib/startLayout.ts`, `src/stores/startStore.ts`, kept per computer), `widgets.tsx` with the thirteen widgets, the New menu, and the data hooks in `useStartData.ts` (recent pages, pinned pages with the tag `pinned`).

- A widget shows only the person's own data and an empty state that says what will appear; one that needs AI says why it is off.
- The Pages page (`NotesPage`) is what the pages show when no page is open (recent pages, every page, a name filter); the start page is only the house. A new widget is one entry in `WIDGETS` and one component; the default layout is Today, Pinned, Recent, Progress and Plans (a layout the person saved is kept).
- The page is shown without side panels.
