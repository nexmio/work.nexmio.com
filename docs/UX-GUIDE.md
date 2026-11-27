# Nexmio Work UX guide

The rules every screen in Nexmio Work follows, so the app looks and works the same everywhere. Read it before designing or building a UI change. The values behind it are in [`design-system/tokens.json`](design-system/tokens.json) (the same values as `src/index.css`), and each component has a page under [`design-system/components/`](design-system/components/) with its rules and a static preview (`preview.html`, styled by `components/bundle.css` with the token names as CSS variables).

When the app changes a colour, a size or a pattern, change it here in the same commit.

Nexmio Work is a desktop app for Markdown pages with a local AI. It is calm and dense: a working tool for one person, with plain English and no decoration. Use this book for every new screen, so Nexmio Work looks and works the same everywhere. When a choice has been made before, reuse it; when it has not, decide it here first.

## Working rules

- **Show a design before building a UI change**, and build what was approved.
- **Reuse before inventing.** Find the screen that already does something similar (an area, a dialog, a row, a menu) and copy its parts and its words.
- **Everything works without AI.** An AI button is disabled with the reason as its tooltip (`useAiBlocked`), never hidden in a way that breaks the screen.
- **The AI is found the same way everywhere:** above a page (`NoteAiMenu`) and at the top of an area (`AreaAiMenu`: what the AI can do there, and a question for the chat).
- **The AI only proposes.** Nothing the AI writes reaches a page before the person accepts it.
- **Nothing is lost.** Deleting asks first and says that the thing stays in the version history.
- **Tags decide what a page is** (`epic`, `meeting`, `pinned` in its properties), never the folder.
- **Say what, get only that.** An entry that names a kind (New → Task) opens only that kind's box. A choice of kind is asked only where nothing was chosen (Ctrl/Cmd+Shift+N: T, I, N).

## Content fundamentals

- **English, sentence case** in every button, label and title: "Make an epic", "Pin to the start page", "Open the start page when Nexmio Work starts".
- **Write from the person's side.** Name things as they see them: "Quick pages", "the hardware parts", "Working on"; never internal names (`captureKind`, EP).
- **A button says exactly what happens**: "Save task", "Delete", "Download and find my hardware". The toast after it says what was done: "Saved the task in Work." with **Open**.
- **Short, plain sentences.** No exclamation marks, no emoji, no apologies. An error says what went wrong and what to do: "Unload the AI before downloading another model".
- **Confirm titles are questions with the name in curly quotes**: "Delete the meeting “Weekly with Mette”?". The description says what goes and what is kept: "…they stay in the version history, so they can be brought back."
- **Empty states name what will appear and how to add the first**: "No meetings yet. A meeting is a page with the tag `meeting`. Press **New meeting**…".
- **Help text** lives in a `?` (InfoHint) next to the thing, with "Read more" to the guide. Do not put paragraphs on the screen when a `?` will do.
- **Times** follow Settings → Appearance → Time format (`formatTime`); dates read `Thu 29 Oct` (`shortDate`), and "yesterday", "09:05 today" for recent changes.

## The window

Header (`sidebar`) on top, status bar at the bottom. At the top: the wordmark, the menus File, Go and Help, the vault, the search field in the middle (it opens quick open), the AI status, the help button and the two buttons that hide the list panel and the right panel. Left edge: the **navigation** (`ActivityRail`): a primary "New …" button that makes the thing of the area that is shown, then Start, Pages, Tasks, Plans, Meetings and Ideas, each with an icon and a name (and a number or a dot for what waits), and Settings and **Collapse** at the bottom. Collapsed, it is the narrow icon column and each icon shows its name on hover. Then the list panel, the middle and the right panel. Panels are resizable and remember their size.

- **An area** (Pages, Tasks, Plans, Meetings, Ideas) is its row in the navigation + a list panel at the left (`PanelHeader`) + a page in the middle (`ViewHeader`) + the chosen thing in the right panel when it has one (the Task tab, the Part tab). A click in the list shows the thing in the middle.
- **The right panel has tabs** (`RightTabs`): Outline, Links, History and Images where a page is shown; an area without a page has only its own tab (Task, Part) and the Timer while one runs. The panel never shows a page that is not on the screen.
- **The AI is a box over the right side** (`AiBox`): round corners, a shadow, from under the top bar to the bottom, about as wide as a side panel. **AI** in the top bar or Ctrl/Cmd+L opens it over anything; Esc or × closes it; it stays mounted so a half-written question is kept.
- **Full screen for the text:** hide both panels with the two buttons at the top right and fold the navigation; the text keeps its line width and stands in the middle.
- **The start page** fills the window: both side panels hide while it is shown and come back as they were.
- **Middle pages** start with a `ViewHeader`: title left, the page's buttons right, the main action last as the primary button. Small things that belong to the title (an epic's tags) stand right after it (`afterTitle`). Everything else about the page is in a `···` menu. The page below has the `space-5` gutter.
- **Reading rules** (for dyslexia and for a short attention): small headings are in sentence case (`section-label`), a done item is dimmed with its tick and never struck through, an icon always has a word beside it except a checkbox and a task's status dot (its menu has the words), and a screen shows one thing to do at a time where it can (an epic's groups in Tasks).
- **Narrow widths** stack to one column (start page under 640px and three columns from 1100px, the calendar's short names under 230px; `useNarrow`).

## Visual foundations

- **Colour** comes only from the tokens. `primary` marks the one main action and the current day; `accent` marks what is selected (the current row, the open rail icon, a pressed filter); `muted` is hover. Status: Doing = `accent`, Waiting = `warning` at 25% under `foreground`, Dropped = `muted` and struck through.
- **Surfaces**: `background` for the middle, `sidebar` for panels, rails, header and status bar, `card` for anything raised (dialogs, menus, toasts, epic boxes, widgets). A dialog sits over a 50% black overlay with `shadow-dialog`; menus and toasts use `shadow-menu`. Nothing else has a shadow.
- **Borders** are hairlines in `border` (`input` for controls). A dashed border means "drop or add here" (+ Add a task, Pin a page from its ··· menu) or "being arranged" (Customize).
- **Type** is the system font stack, `body` 14px. Hierarchy comes from weight and `muted-foreground`, not size: `page-title` 16px semibold, `row-strong` for task and epic names, `small` 12px for facts, `section-label` 11px uppercase over groups.
- **Radii**: `radius-md` for controls and rows, `radius-lg` for dialogs and boxes, `radius-xl` for widgets, `radius-full` for chips.
- **Spacing** steps are 4px: `space-2` between buttons, `space-3` inside panels, `space-4` inside dialogs and widgets, `space-5` page gutter.
- **Focus**: every control shows a 2px `ring`. Keep text at 4.5:1; the light `warning` as text misses this, so use it as a ground.
- **Motion**: none beyond colour transitions on hover.

## Iconography

Icons are `lucide-react`, 16px (`icon`), stroke style, in `currentColor`, before the label in a button. Reused meanings: House = Start, Files, Search, Lightbulb = Ideas, Network = Plans, ListChecks = Tasks, CalendarClock = Meetings, Plus = new/add, Pencil = edit, Trash2 = delete, X = close/remove, ChevronUp/Down = move, MoreHorizontal (···) = more for this thing, Star = pinned, Target = Focus, Sparkles = AI, Presentation = Start meeting. No emoji.

## Themes

Nexmio Work has eight themes (Light, Dark, Slate, Paper, Mint, Midnight, Graphite, Ember). A theme is a full set of the 16 colour tokens, set on the page as `data-theme` (and the class `dark` for the dark ones); the values are in `src/index.css` and `docs/design-system/themes.json`. A screen uses the tokens and never a colour, so it works in every theme.

- A new theme is a new block in `index.css`, an entry in `src/lib/themes.ts` and in `themes.json`. `themes.test.ts` checks it: text 4.5:1 on every surface (foreground, muted-foreground, primary-foreground, accent-foreground), primary and the focus ring 3:1.
- Keep the roles apart in every theme: the writing area (`background`), panels and bars (`sidebar`), raised things (`card`), hover (`muted`), selected (`accent`).
- Do not use `warning` as text colour; it is for grounds and borders.

### The Nexmio Work look

- **Light and Dark** are the purple Nexmio Work themes. Dark is the default. The other six themes keep their own colours.
- **The wordmark** is the shared `Wordmark` component: the N mark (an image), the text "exmio" in Poppins SemiBold and a small purple "Work" tag. The name is never baked into an image. Use it on the splash, the welcome screen, About and the top bar.
- **Poppins** (bundled, not loaded from the web) is used only for the wordmark and big headings on those screens. Everything else uses the system font.
- **Brand banner:** the start page has a banner band at the top with the greeting, the date and the page's buttons on it; the welcome screen and About show a purple backdrop. `src/lib/brandImages.ts` gives the light or the dark pictures from the active theme's `dark` flag, so Mint shows the light banner and Midnight the dark one. The splash is always dark. No motion. Buttons on the banner have a solid background.
- **The top bar has the compact wordmark** at its left end on every page: only the N mark and the "Work" tag, without "exmio".
- **Dark keeps purple for what matters.** Its surfaces carry a little blue-violet colour (hue 280, between Midnight and purple), with clear steps between the page, panels and cards and visible borders, so it is easy on the eyes; the purple buttons, marks and banner stand out.

## The parts a screen is built from

Every control comes from `src/components/ui`, so a change to how one looks is made once and reaches every screen (lint refuses a raw `<button>`, `<input>`, `<textarea>` or `<select>` in a feature):

- `Button`: anything that looks like a button. `PlainButton`: a button whose look belongs to the row, chip, tab or rail icon it is.
- `Input` (a field in a form), `InlineInput` (a field inside a row or list: + Add a step, renaming in place, the file filter), `TagChip` and the Tags window (Nexmio Work's tags filled with a mark and what they do, the person's own outlined with a `#`), `TimeInput` (a time: type it, or pick it from a list of every quarter of an hour that opens under the box; a time that is not on the list is kept as written).
- `MarkdownField` (several lines, written as Markdown, with live preview) and `MarkdownText` (shows saved Markdown formatted): every text of more than one line that is a page, a log or a meeting's notes. One line (a title, a task, a step, a name) is `Input` and is never Markdown. `Textarea` is for plain text that is not a page (instructions for the AI, a list of words); `Select`, `Checkbox`, `Radio`, `Label`.
- `Dialog`, `ConfirmDialog`, `PromptDialog`, the menus (`menuStyles`), `ViewHeader`, `Trail` (the path above a task, an epic or a plan), `TagPicker` (the tags of a task or an epic, with suggestions), `PanelHeader`, `RowActions`, `MoveButtons`, `InfoHint`, `MonthCalendar`.

## Interaction patterns

- **Rows**: the pencil and the bin show on hover or focus (`RowActions`); the arrows to move show the same way (`MoveButtons`, also Alt+Up/Down), and always while a page is being arranged.
- **Menus**: `···` holds the actions of one thing (a page: Rename, History, Pin, Tags, Export). **New ▾** lists what can be made. Same look everywhere (`menuStyles`).
- **Dialogs**: one question, Cancel as a ghost button, the action as the primary (or destructive) button on the right. Enter saves a one-line field; Ctrl/Cmd+Enter saves a multi-line one; Esc closes.
- **Text boxes for pages** take Tab and Shift+Tab to indent (`Textarea indent`), like the editor.
- **Toasts** confirm a finished action, bottom right, with one action (Open, Undo) when it helps. Errors stay longer.
- **A choice that needs setup shows the setup under its own row** (Settings → AI: the chosen row opens its model list or its address fields). Two places for one choice are not made. Things that are new say **Beta** in a small chip instead of "Recommended".
- **Lists that grow sort themselves by what is open, not by moving lines:** open items first, done items last under a small **Done · n** label. The Tasks area shows every epic in rows, or one epic, instead of filters.
- **Choices remembered per computer** (time format, start page layout, the start page at launch) are kept in browser storage, wrapped in try/catch, and the screen works without them.
