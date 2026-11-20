# Decisions

The rules that hold today and why, by area in the order of `docs/AREAS.md`. Read the sections of the areas a change touches. One line per rule; a new decision is added to its section as one line, and a rule that is replaced is changed here, not added again. The full history, with the reasons for everything that came and went, is `docs/history/DECISIONS-2026.md`: search it, do not read it whole.

An area's own `CLAUDE.md` holds its working rules; they are not repeated here.

## Product rules (every area)

- **Never lose user data.** Every write that replaces content is committed before or after (snapshot commits before a rename, delete, import, AI apply, folder tag or task/idea delete); undo is a commit of its own and refuses over later edits (`ops::undo_commit`). Principle 1.
- **The AI only proposes.** Every AI change is a proposal or a pick the person accepts; nothing the AI writes reaches a page by itself.
- **Plain files.** A vault is ordinary folders of Markdown and works in any editor. Tags in a page's properties decide what it is (`epic`, `meeting`, `plan`, `plan-finished`), never the folder. What Nexmio Work keeps that is not the page's own text is in `.vault/` (`meta.json`, `order.json`), plain JSON, committed with the vault.
- **Nexmio Work sends nothing**: no update check, no telemetry; "What's new" comes from the bundled `CHANGELOG.md`; bug reports are GitHub issue forms the person sends themselves.
- **Words**: "page", not "note", in everything a person reads (the exceptions are in `CLAUDE.md`); a meeting's text is **Notes**; "epic", never "area", for a group of tasks; "Load AI"/"Unload AI", never wake/sleep; the area of plans is **Projects** (`PLANS_LABEL`, code keeps `plans`).
- **Names**: no file or folder name Windows or OneDrive rejects (`fs_ops::name_problem`, `nameProblem`), and two entries never differ only by case (`fs_ops::ensure_name_free`, `lib/nameConflict.ts`); only a changed name is checked on rename.

## Shared UI

- Every control in a feature comes from `src/components/ui` (lint refuses raw `button`, `input`, `textarea`, `select` outside `src/components/`); pass-through parts (`PlainButton`, `Checkbox`, `Radio`, `InlineInput`) keep a place's look.
- `docs/UX-GUIDE.md` and `docs/design-system/` are the reference; a UI change follows and updates them.
- Text of more than one line that is the person's writing is a `MarkdownField`, shown with `MarkdownText`; one line is an `Input` (a log line is a `singleLine` field).
- Small headings in sentence case; a done item is dimmed with its tick, never struck through; an icon always has a word.
- Eight fixed themes, no custom colours (`settings.theme`); Dark is the default; every theme passes the contrast test (`themes.test.ts`).
- Poppins SemiBold (OFL, bundled) only for the wordmark and big headings; no web fonts.
- `ViewHeader` is a container (`@container/header`): in a narrow header the Beta mark of an AI button and an epic's progress bar are left out.
- An area's AI button is `AreaAiMenu` (jobs go to the AI queue, questions open the chat), the same look as `NoteAiMenu` above a page.
- `InfoHint` is our own small bubble, not a tooltip library.
- `src/components/ui/*.tsx` keep the lower-case shadcn file names.

## Shared core

- Every backend call goes through `src/lib/api.ts`; types shared with Rust are generated into `src/bindings/` by `ts-rs` during `cargo test` and committed.
- Paths over IPC are vault-relative with `/` and go through `vault::paths::resolve`; `.vault` is refused except through `resolve_internal`.
- Notes are written atomically (temp file, rename). The watcher reports every change; the editor ignores events equal to what it last wrote or read.
- Links: wiki-links and embeds are resolved in Rust (`links::resolve`) and in TypeScript (`lib/links.ts`) by the same rules; rename rewrites wiki-links and embeds, not Markdown `[x](note.md)` links.
- The HTTP client fails rather than fall back (keeps the 10 s connect timeout); `Regex::new(..).expect` only for fixed literals in `LazyLock`.
- Settings files from older versions always load: new fields have serde defaults, removed ones are dropped, `schemaVersion` stays 1.
- Per-computer choices (layout, folds, time format, start-page layout, focus timer, debug mode, seen notices) live in `localStorage` behind try/catch, never in `settings.json`.

## App shell

- `uiStore.centerView` decides the middle; the left panel follows it (`areaOf`); the start page hides both side panels.
- The areas open one way (`openNavArea`, `NAV_AREAS`): navigation, the Go menu and Ctrl/Cmd+1…6 in one order. The top button of the navigation makes the new thing of the area shown (`newAction`).
- The right panel's page tabs (Outline, Links, History, Images) are only where a page is shown (`rightTabsFor`); other areas have their own tab (Task, Part) and the Timer while one runs.
- The AI (chat and queue) is a box over the right side, not a tab (`AiBox`): it opens over anything, the start page too, and changes nothing under it; Esc or × closes it. A task opened as a full page has no Task tab, and Back goes where it came from (`taskFrom`).
- Search is the field in the top bar (quick open, with a last row for full-text search); the AI status chip is in the top bar.
- The start screen is a small second window (`splash`); the main window starts hidden and is shown by `splash_done` (or after 20 s).
- Window close: the backend asks the frontend to flush, then commits; after 5 s it commits and closes anyway.
- "Inspect element" only in debug mode (Settings → About).
- Rarely used screens load when first opened (`React.lazy`; `LazyWhen` keeps a window once opened so it closes as before): Settings, Help, Export, Import, About, Recover deleted, the meeting screen, Projects (the plan views), Time and Look back. The first file went from 1,985 KB to 1,648 KB, and the start in the headless harness from 241 to 229 ms (median of 7).
- Release builds keep `'unsafe-inline'` for styles (`dangerousDisableAssetCspModification: ["style-src"]`) because CodeMirror adds inline styles.

## Editor

- Live preview is a CodeMirror `StateField`; markers on the cursor line show only when the editor has focus. Images replace their Markdown in place; checkboxes are widgets on every line.
- Tables are widgets outside the cursor with a toolbar above; Tab on a raw table does not format it.
- Tab/Shift+Tab move any line (list items by their marker, others by two spaces); Enter on an empty nested item goes out one level.
- Nexmio Work's own tags (`meeting`, `epic`, `pinned`, `plan`) do nothing as `#tag` in the text: the `#` suggestions leave them out, and one written there gets a button in the tags line that puts the real tag in the properties (the text is not changed).
- Mermaid (exact version, loaded on first diagram, `securityLevel: "strict"`); a block with no language that starts like a diagram is drawn as one; an AI diagram is drawn before it is added.
- Source view is per computer (`nexmio.sourceMode`).
- Images: the link stays a normal Markdown path unless the vault chooses `![[name]]` (`imageLinkStyle`); size in the alt text or alias; `add_images` checks every file before any copy (picture type, 25 MB).
- Right-click on a selection shows Cut/Copy/Paste first, then one AI line, then Add as a task or idea.
- Spelling help (`editor.aiSpelling`, off): marks `wrong => right` words as decorations only; the text never changes by itself.
- Reading choices (line and letter spacing, font, follow line) are settings applied as CSS variables (`lib/reading.ts`).

## Pages and files

- Projects are their own trees under **Projects**; one project is never inside another; a project is a new folder in the vault root.
- Own order is per folder, by names, in `.vault/order.json`; new names come after; renames carry the order along.
- Inbox (code: `LandingSection`) shows the meetings, quick-pages and `Tasks` folders; NEW lasts 7 days until opened (`seenStore`). The daily calendar is at the top of the Pages panel.
- Pictures are hidden from the tree (`withoutImages`); the Images tab lists them.
- Import never overwrites, never follows symlinks, skips hidden files and files over 50 MB, cleans names and does not rewrite links; it is one commit after a snapshot.
- Index pages: `<folder> index.md`, the list between `nexmio:index` markers, shortest unambiguous links.
- A tag on a folder is written into each page in it, once (`ops::set_tag_in_folder`); a page added later does not get it.
- Export: Word with text list markers; PDF through the system print dialog; HTML escapes raw HTML, links only http(s)/mailto/anchors, images only from the vault.
- Opening a vault opens the new folder before the open vault is closed (the same folder is closed first), so a folder that cannot be opened leaves the open vault working; the frontend reads the settings again after an open, so the vault list is current.
- **New project is one window** everywhere (`requestNewPlan`: the project and its plan); the old project window is only for Project settings. The list of everything that can be made is `NEW_THINGS` (`lib/newThings.ts`), used by the arrow next to the New button and the start page's New menu.
- The demo vault is embedded (`src-tauri/demo-vault/`, dates as `{{today}}`…) and written into a new folder, never into one that exists.
- Tasks and ideas are never opened as pages (`openNote` sends them to their area).

## Search

- Full-text search in SQLite FTS; backlinks resolved at query time.
- Semantic search keeps vectors in `.vault/embeddings.db` (gitignored), brute-force cosine; `hybrid_search` uses reciprocal rank fusion (k = 60); embeddings are always local.

## History

- Commit messages follow the commit kinds (`git::CommitKind`); a rename makes a snapshot first only when something is unsaved.
- Backup is a bare Git repository `<folder>/<vault>.git`, pushed with `git2`, never forced; a backup with another history is refused.
- `changed_pages` lists the pages changed in a span (Look back).

## Tasks

See `src/features/tasks/CLAUDE.md` for the file format and the area. Beyond it:

- No planning: the old words `due:`, `plan:` and `est:` stay in the file and out of the title, but nothing reads them (they are not on `Task` or `MetaPatch`); `made:` is added once to tasks Nexmio Work makes.
- A task always goes into an epic the person chose; Nexmio Work never makes an Inbox epic.
- Tasks and steps move in the page itself (`tasks::move_item`); done tasks are shown after open ones without changing the file (`openThenDone`).
- The epic order is `epics` in `.vault/order.json`.
- A task links a page with the first `[[link]]` in its line (`Task.link`), not part of the title; one link per task.
- Status shows as a label; nothing else about the task changes.
- A task can be pinned to the start page (`TaskMeta.pinned` in `.vault/meta.json`, `task_set_pinned`); it follows a rename and a move like the rest of its entry. Pages and epics are pinned with the `pinned` tag (`togglePin`, `PinMenuItem`).
- The task list is cached per file by modification time and size (`task_cache`); `taskStore.load` shares one read between callers.
- Time is a log line `⏱ 1 h 20 min · 09:00–10:20 · note` (`timeLogText`); a running timer's start is kept per computer; the timer replaced Focus.
- "Left off: …" is a log line written by the person, not history.
- Ticking writes "Done" (unticking "Open again") with the day in the task's history; tasks ticked before 0.28 have no day.
- Tags on tasks are `#tag` in the line; an epic's tags are in its properties and count for its tasks.
- TEMPORARY since 0.23: the move of old pins and `for:`/`after:` words into `meta.json` (`meta::migrate`, `MetaMigrationDialog`) is still in the code and should be removed.
- Look back is read, never stored; a week is Monday to Sunday, this week ends today (`lib/lookBack.ts`).

## Ideas and capture

See `src/features/capture/CLAUDE.md`. Beyond it:

- Ideas are dated bullets in `Ideas.md`, never checkboxes; using one keeps it, marked `status:used`. An idea ties to things by `[[links]]` in its line.
- Ideas are cards in Open, Used and Archived; **To plan…** asks the Projects area (`uiStore.ideaToPlan`), which writes the part.
- The quick-pages folder (`quickNotesFolder`, name kept) is where pages from ideas and saved reports go.

## Plans

- A plan is a page with the tag `plan` whose nested list is its parts; a part's note is indented `> ` lines under it.
- A plan lives in a project; the project's tag is the plan's tag, given to the plan page, its epic and what is made from it (new things only).
- The whole plan has one epic (`epicOfPlan`); a part is not made into an epic.
- A plan opens on the map; the map's layout is kept per computer by the words of a box (`mapLayout.ts`), not in the page.
- The chosen part is shown in the right panel (Part tab); moves are words (Earlier, Later, Under the one before, One level up).
- Repeat puts the names under the repeated part, each with the steps and a task.
- An archived plan can be deleted: the plan page always, the rest only when ticked.
- The Overview of a project is read, never stored (`overview.ts`).

## Meetings

See `src/features/meetings/CLAUDE.md`. Beyond it:

- After a meeting: actions to Tasks and Prepare next work without AI; the next meeting is seeded a week later with unticked items.

## Start page

See `src/features/start/CLAUDE.md`. Beyond it:

- Get started has five steps read from the vault, not from clicks; Close is kept per vault on this computer.
- Pinned is the pin in `.vault/meta.json`, shown as the tag `pinned`.
- Opening on the start page at launch is a per-computer choice.

## AI

See `src/features/chat/CLAUDE.md`. Beyond it:

- **Where pages may go**: a provider is local only at a loopback address (recomputed, never trusted from the file). A cloud AI is OpenAI-compatible only and used only after `ai.cloudConsent` (provider, address, time); never for a project marked Local AI only, which uses the Local AI (`ai.localProviderId`). `ai::router::select_notes` is the only path; embeddings stay local.
- The AI is fixed commands where you work, plus the chat in the right panel; no prompts to write. Every AI button is disabled with the reason without an AI (`useAiBlocked`).
- Every AI job runs in the queue (`aiJobStore`): `EditJob` for text in a page, `PickJob` for a list to tick or a text (`AiPickSpec.text`); the queue opens by itself and every job has Go to.
- The plain chat reads pages, tasks, projects, meetings and the help (`ai/assistant.rs`) and may propose only tasks and parts; page edits stay with the fixed commands and skills. How-to answers come from the help (`search_help`); Show me opens a fixed list of places.
- Skills: Nexmio Work carries out the job and the model writes one step; built-ins are in code (`skills::builtins`); the skill is resolved in the backend by id; runs are bounded (50 rewrite, 300 sort, 30 create) and long runs start with three pages.
- Every change is checked before review (links, tags, numbers, names, lost parts); Fix spelling applies only `wrong => right` words.
- Answers are cleaned in one place (`ai/clean.rs`): reasoning, lead-ins (English and Danish, curly apostrophes), a closing line, a fence. A chat-template error is retried once without a system message.
- The plain chat sends only visible text and the activity lines of earlier turns; attached pages are read in Rust against the scope (5 pages, 12,000 characters; folders as names above 12 pages).
- "About me and my notes" and "About this project" are read by the chat and skills, never by the fixed commands; the answer language is its own setting.
- The AI has no name and is marked Beta; "AI can make mistakes" stands under every answer.
- Rewrite keeps the meaning and is checked for lost numbers, links and tags (`lib/facts.ts`).
- A status report gives the AI only Look back's list; with all projects and a cloud AI, Local AI only projects are left out.

## Built-in AI

- llama.cpp's `llama-server` started as a hidden child process, files downloaded and pinned to size and SHA-256 in `engine/catalog.rs`; models pinned to a commit.
- Two engines only: Vulkan and CPU; older choices (CUDA, ROCm, SYCL) are read as Vulkan.
- Safe by default: `127.0.0.1`, a free port and a random API key per load (in the environment), no web UI, no extra arguments.
- It never outlives Nexmio Work (Linux `PR_SET_PDEATHSIG`, Windows job object, a pid file).
- The chat is locked until it is loaded, in the UI and the backend (`require_awake`); a press loads it (`lib/wake.ts`).
- Errors are explained by `engine::diagnose`; thinking is off by default (`--reasoning off`).
- The Store package has the built-in AI too (the owner's choice); the risk under Store policy 10.2.2 is known.
- Foundry Local and Phi Silica are removed; their settings load and move to the built-in AI.

## Settings and help

- Settings have seven sections and save at once, with Undo; dangerous controls stay explicit buttons.
- Settings → AI is one list where each row holds its own setup; "Test it" asks one short question with no pages (`ai_test`).
- `ProviderKind::Anthropic` stays only so old settings load; it is blocked.
- The help is Markdown in `src/features/help/topics/`; a test checks every Read more link. The assistant reads the same topics.
- Report a bug / Suggest a feature open GitHub issue forms filled with version and edition.

## Build and docs

- Versions: `package.json` is the source; a test keeps the other places equal; builds show `+<commit>` and `.dirty`.
- Two lines: `main` is Preview (`.0` versions); Stable is a Preview the owner makes Stable; a fix for Stable is a `hotfix/X.Y.Z` branch from the Stable tag, cherry-picked to `main` and never merged (`docs/RELEASING.md`).
- The Store texts and "What's new" are made from `docs/STORE-LISTING.md` and `CHANGELOG.md`; the Store package is a full-trust MSIX built by `scripts/msix/Build-Msix.ps1`. It is kept as a download of the release run and uploaded in Partner Center by hand: the workflows no longer send it to the Store (switched off 0.28, `scripts/store/Submit-Store.ps1` is kept).
- No macOS build for now.
- Licence: Apache-2.0 with the Commons Clause and `NOTICE` (from 0.25.0).
- The website (`site/`) is plain HTML in English, published by `pages.yml`; downloads follow the GitHub releases; shared sentences with the README are in `docs/shared-facts.json` (checked by a test).
- CI runs `pnpm audit --prod --audit-level high`; a high advisory in a shipped dependency fails the build.
- Smoke tests and screenshots run the real frontend headless with a pretend backend (`scripts/e2e/`); screenshots never come from the owner's screen.
- Toolchain is pinned: Node 22, TypeScript 5.9, ESLint 9, pnpm; Rust `rust-version` in `Cargo.toml`. Pinned majors: `reqwest` 0.12, `keyring` 3, `react-resizable-panels` 3; `git2` without default features.
- ESLint: only `rules-of-hooks` and `exhaustive-deps` from the hooks plugin; tests may use the `no-unsafe-assignment` and `unbound-method` exemptions.
- A new dependency is added here with its reason.
- One component per file. `uiStore` is made of parts in `src/stores/ui/` (stored choices, panels, windows, messages); `useUiStore`, `reportError` and every field keep their names.
- The Rust development container is `rust-dev`.
