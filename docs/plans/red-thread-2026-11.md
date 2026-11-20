# Plan: the red thread (November 2026, 23 steps)

This plan was written after a review of the whole app (backend and UX) against what Nexmio Work is meant to be:

- A **plan** gathers a project: its tasks, pages and meetings, so it is easy to keep an overview.
- **Tasks** break the work down: an epic, its tasks, their steps, and a timer when it is needed.
- **Pages** are rich text: Markdown, diagrams, pictures.
- Everything is **tracked**, so you can look back on what was done.
- A place for **meeting notes** and for **ideas** that come along.
- The **AI** is local by default and is an assistant that helps across the app, not only a chatbot.
- It is made for one person in IT, but must be easy for others to understand and to start with: every button does one clear thing.

The owner answered "all of it". The steps are done one at a time, in the order below. Each step follows `CLAUDE.md` (brief → change plan → ok → build → change report → checks and docs). A step marked **Design** shows a design (Artifact type "design") and waits for approval before it is built.

**Progress is kept here:** a step is ticked in the list at the bottom in the same commit that finishes it.

## Before any step

- The branch `feat/plan-and-ai-queue` (Plans and the AI queue, uncommitted) is tried by the owner with a real AI, then committed and merged. Step 0.
- One step = one branch from `main` (the name is given). `git status` is clean before branching.
- Checks: `pnpm format:check && pnpm areas check && pnpm lint && pnpm typecheck && pnpm test`; Rust only when `src-tauri/` changed (`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test`, in the Rust distrobox).
- Docs with every user-visible change: `CHANGELOG.md` `[Unreleased]`, the help topic, `docs/MANUAL_TESTS.md`, `docs/DECISIONS.md`.
- Nothing is committed, merged or released before the owner says so.

---

## Phase 0: finish what is open

### Step 0: try, commit and merge Plans and the AI queue

**Branch:** `feat/plan-and-ai-queue` (exists). The owner tries it with a real AI (`docs/MANUAL_TESTS.md` → "Plans and the AI queue (0.28)"); what is found is fixed on the branch; then commit and merge.

**Done when:** `main` has the work and `git status` is clean.

---

## Phase 1: small faults and clear words

### Step 1 (#6): the meeting's notes are called "Pages"

**Kind:** fault. **Areas:** Meetings. **Branch:** `fix/meeting-notes-label`.

The bulk rename from "note" to "page" reached the meeting screen: the heading over the meeting's text says **Pages** (`MeetingFocus.tsx`, `MeetingsView.tsx`) and the capture hint says "It does not end up in the meeting's pages." The rule in `CLAUDE.md` keeps **Notes** for a meeting. Change these words back to "Notes" and check every string in `src/features/meetings/` for the same fault. Never change a string that is read back from a file (`## Notes` stays).

**Done when:** the meeting screen and the meeting page say **Notes**; a test checks the heading.

### Step 2 (#7): the right panel shows a page that is not open

**Kind:** change in one place. **Areas:** App shell. **Branch:** `fix/right-panel-without-page`. **Design.**

In Tasks, Ideas and Time, the right panel shows the Outline, the tags and History of the last page that was open, which is not on the screen (its tags can be changed by mistake). The tabs Outline, Links, History and Images are shown only while a page is open in the middle; in an area without a page the panel shows the area's own tab (Task, Part, Timer, AI) or closes, as `rightTabsFor` decides.

**Done when:** Tasks, Ideas, Time and Meetings never show another page's outline or tags; tests on `rightTabsFor`.

### Step 3 (#3): an epic says which plan it belongs to; "area" is "epic"

**Kind:** change in one place. **Areas:** Tasks, Plans. **Branch:** `feat/epic-shows-its-plan`. **Design.**

- The epic made for a plan (its `source` points at the plan page) shows a line under its title: **Part of the plan “X”** with **Open the plan**. A task of that epic shows the plan in its trail.
- The Tasks panel groups the epics by project (a project's epics under its name, the rest under **Other epics**).
- "Choose one area" and every "area" that means an epic become "epic" (check the help).

**Done when:** from a plan's epic one click opens the plan on its map; tests for the grouping and the link.

### Step 4 (#9): complete menus and one shortcut per area

**Kind:** change everywhere. **Areas:** App shell. **Branch:** `feat/menus-and-area-keys`.

- **Go** lists every area in the order of the navigation: Start, Pages, Tasks, Plans, Meetings, Ideas, then Search and the rest.
- **File → New** has **Plan** too.
- **Ctrl/Cmd+1 … 6** open the areas in that order (check that no key is taken; `src/lib/shortcuts.ts`, Settings → Shortcuts, the help).

**Done when:** every area can be reached from Go and from its key; tests in the shortcut list.

### Step 5 (#21): the review plan and the distrobox name

**Kind:** docs. **Areas:** Build and docs. **Branch:** `docs/plan-status`.

Tick the tasks of `docs/plans/review-2026-11.md` that are done in the code (check each: harness, backup, task cache, What's new, Mermaid, privacy, demo vault…), and leave the rest open. The docs name the Rust distrobox `rust-dev`; the owner chose to keep that name, so the docs stay as they are.

**Done when:** the list says what is really done.

---

## Phase 2: easy to start, one place for each thing

### Step 6 (#19): "Get started" on the start page

**Kind:** new feature. **Areas:** Start page, Settings and help. **Branch:** `feat/get-started`. **Design.**

A card at the top of Start for a new vault, with five small steps that tick themselves when they are done (read from what is in the vault, not from clicks): make a plan, break it into parts, make a task of a part, start a timer, write a meeting. Each step has one button that goes to the place. **Try the demo vault** opens the demo. The card can be closed, and it goes away by itself when all five are done. One short sentence explains the idea: Plan → epic → task → step.

**Done when:** a new vault shows the card, each step ticks when its thing exists, and closing it is remembered per vault.

### Step 7 (#10): tags in one place on a page

**Kind:** change in one place. **Areas:** Editor. **Branch:** `fix/page-tags-one-place`. **Design.**

A page shows its tags as the chip row above the text only. The Properties box is shown only when the page has other properties than `tags`, and does not list `tags`. The right panel's Outline tab does not show the tags again.

**Done when:** a page with only tags shows one row of tags; a page with other properties still shows them.

### Step 7b: the Actions column of a meeting is squeezed

**Kind:** fault (found while checking phase 1). **Areas:** Meetings. **Branch:** `fix/meeting-actions-narrow`.

In the Meetings area, with the right panel open, the **Actions** column shows its tasks cut to one letter, with only their date. Make the action rows wrap their title and keep the date on its own line when the column is narrow; check the same rows in the meeting screen.

**Done when:** a headless picture at 1600 px with the right panel open shows each action's whole title.

### Step 8 (#11): the epic page starts with Now

**Kind:** change in one place. **Areas:** Tasks. **Branch:** `fix/epic-tags-in-header`.

"Tags of this epic" moves from above the Now card into the header (the tag chips next to the title, + tag) or the **More** menu, so Now is the first thing on the page.

**Done when:** the Now card is the first block under the header.

### Step 9 (#12): fewer Beta marks

**Kind:** change everywhere. **Areas:** Shared UI, Plans, AI, Settings and help. **Branch:** `chore/beta-marks`.

Ask the owner which areas are stable now. Remove the **Beta** chip from those, and put one **About the betas** entry in Help that lists what is still in beta.

**Done when:** only the areas the owner names show Beta.

### Step 10 (#8): one way to write something down

**Kind:** change everywhere. **Areas:** Ideas and capture, Pages and files, App shell. **Branch:** `feat/one-capture`. **Design.**

Today there are seven ways to make something (Page, Meeting note, Quick page, Task, Idea, Today's daily page, Write it down…), Quick page, Idea and Write it down overlap, the Pages panel has two New buttons and five sections, and "Landing" says nothing.

- **Write it down…** becomes the one quick way: one box, and a choice under it (Task, Idea, Page, Meeting) that is guessed from the words when the AI is there, and can always be changed.
- **Quick page** goes into Ideas (or the daily page; the design shows both and the owner chooses).
- The Pages panel keeps one **New**. "Landing" gets a name that says what it is (the design proposes one), or goes into All files.
- File → New keeps the kinds; nothing that works today disappears without a way to the same result.

**Done when:** the design's flow works, and every way that existed has a place in it or a reason in DECISIONS for going.

---

## Phase 3: the red thread

### Step 11 (#1): a project has a plan (one idea, not two)

**Kind:** change everywhere. **Areas:** Plans, Pages and files, AI (projects). **Branch:** `feat/project-has-a-plan`. **Design.**

"Project" and "plan" are two words for one thing today ("This plan is not in a project yet", "Projects without a plan", "Plan from a project"). Make it one idea: a **project** is the folder with its AI rules and its tag, and its **plan** is the page that is its front page.

- The Plans list shows projects; a project opens on its plan. A project without a plan shows **Make the plan** in place of the map.
- The notice "not in a project" and the separate "Plan from a project" go; a plan in no project is moved into one when it is opened (the current `MoveToProjectDialog`, asked once).
- The words in the app and the help say "project" for the whole and "plan" for the map of it.
- Nothing is moved or rewritten in existing vaults without the person saying yes.

The owner chose **Projects**.

**Done when:** a new person meets one idea; old vaults open as before.

### Step 12 (#2): the project's overview

**Kind:** new feature. **Areas:** Plans (reads Tasks, Meetings, Pages through shared stores). **Branch:** `feat/project-overview`. **Design.**

A third view next to Map and Outline: **Overview**. Everything is found by the project's folder and tag; nothing is copied.

- How far it has come: tasks done of all in the plan's epic, and the next task (Now) with **Open**.
- Waiting for others.
- Meetings: the next one and the last ones with the project's tag.
- Decisions from those meetings (step 15).
- The newest pages in the project.
- Time logged this month on its tasks.

**Done when:** a project with tasks, meetings and pages shows them in one place, and each line opens its thing.

### Step 13 (#4): a meeting belongs to a project

**Kind:** new feature. **Areas:** Meetings, Tasks. **Branch:** `feat/meeting-in-a-project`. **Design.**

- The meeting form has **Project** (optional): it puts the project's tag on the meeting page (and keeps the page where meetings are kept).
- **Actions** of such a meeting can go to the plan's epic: **Move the actions to the project** (one button, or one per action), so they show up in Tasks with the rest of the project.
- Start meeting / Prepare next keep the project.

**Done when:** a meeting in a project shows in its overview, and its actions can go into the project's epic.

### Step 14 (#5): an idea can go into a plan

**Kind:** new feature. **Areas:** Ideas and capture, Plans. **Branch:** `feat/idea-to-plan`.

An idea card gets **To plan…** next to To task and To page: choose a project and where in its plan (the top or under a part), or **A new plan**. The idea moves to Used with a link, like To task.

**Done when:** an idea becomes a part in the chosen place; tests.

### Step 15 (#18): decisions per project

**Kind:** new feature. **Areas:** Meetings, Plans. **Branch:** `feat/decisions-list`.

The `## Decisions` lines of every meeting are read into a list: in the project overview (step 12) and as **Decisions** in the Meetings area, searchable, each with its meeting and date.

**Done when:** a decision written in a meeting shows in both places and opens its meeting.

---

## Phase 4: the AI is an assistant across the app

All AI steps keep the rules: local by default, cloud only after consent and never in a Local AI only project, `ai::router::select_notes` is the only path, the AI only proposes, and everything works without AI.

### Step 16 (#13): the assistant knows tasks, plans and meetings

**Kind:** new feature. **Areas:** AI, Tasks, Plans, Meetings (Rust tools). **Branch:** `feat/assistant-tools`.

Read tools for the chat: list epics and tasks (with status, waiting for, steps), read a plan as an outline, list meetings and their actions and decisions, list what is tagged with a tag. Proposal tools: propose tasks in an epic, propose parts in a plan, both through the existing accept flow. The system text says what the app is (plan → epic → task → step, meetings, ideas).

**Done when:** "What is next on the VPN project?" and "What am I waiting for?" are answered from the real tasks; a proposed task is written only after Accept. Tested with the pretend provider; tried by the owner with a real AI.

### Step 17 (#14): the assistant explains the app

**Kind:** new feature. **Areas:** AI, Settings and help. **Branch:** `feat/assistant-help`.

The help topics (`src/features/help/topics/`) are given to the assistant as a source it can search ("how do I…"). An answer can end with **Show me**, which opens the place it talks about (a fixed list of places: an area, Settings → a section, a help topic). The help topics need to stay up to date for this; a test checks that every place in the list exists.

**Done when:** "How do I make a plan?" is answered from the help with a **Show me** that opens Plans.

### Step 18 (#15): AI for meetings

**Kind:** new feature. **Areas:** Meetings, AI. **Branch:** `feat/meeting-ai`. **Design.**

- **After the meeting:** the AI reads the meeting's notes and proposes decisions and actions (a pick job in the AI queue, like Break it down); the ticked ones are written in the meeting page.
- **Prepare next:** proposes the agenda from the actions that are still open and the last meeting's notes.

**Done when:** both run in the queue, nothing is written before it is ticked, and the buttons are disabled with the reason when there is no AI.

### Step 19 (#16): the AI button offers what fits the place

**Kind:** change everywhere. **Areas:** AI, Plans, Tasks, Meetings, Start page. **Branch:** `feat/ai-fits-the-place`. **Design.**

The AI button in each area's header shows the few things that fit there first: on a plan **Find what is missing**, on an epic **Break it down**, on a meeting **Decisions and actions**, on Start **Write my status**. The full list stays under **More**.

**Done when:** each area's AI menu starts with its own actions.

---

## Phase 5: look back

### Step 20 (#17): the week, and a status report

**Kind:** new feature. **Areas:** Tasks, History, Meetings, Start page, AI. **Branch:** `feat/look-back`. **Design.**

A **Look back** view (from Start and from Tasks): a week (or a period), and for it: tasks finished and moved on (the status history in `.vault/meta.json`), time logged (the task logs), pages written (the version history), meetings held and their decisions. A filter for one project (its tag). **Copy as a status report** gives Markdown; **Write it for me** asks the AI for a short report in the queue. "Trace my work" stays as it is; this view does not need it.

**Ask the owner** before building: a week from Monday, or the last seven days? And is the report in English or in the language of the pages?

**Done when:** a week with work shows it in one place and can be copied as a report.

---

## Phase 6: code health

### Step 21 (#20): split `docs/DECISIONS.md`

**Kind:** docs. **Areas:** Build and docs. **Branch:** `docs/split-decisions`. As task 7 of `docs/plans/review-2026-11.md` (it describes how). The file is about 400 KB.

### Step 22 (#22): load rarely used screens when they open

**Kind:** change everywhere (nothing the person sees). **Areas:** App shell. **Branch:** `perf/lazy-screens`.

The frontend is one 1.9 MB file. Load Settings, Help, the plan map, the meeting screen and the built-in AI setup with `React.lazy` when they are opened, with the same look while they load. Measure the start before and after (the harness) and write the numbers in DECISIONS.

**Done when:** the first file is clearly smaller and nothing looks different.

### Step 23 (#23): split the largest files

**Kind:** change everywhere (nothing the person sees). **Areas:** App shell, Plans, Tasks. **Branch:** `chore/split-large-files`. As tasks 11 and 12 of `docs/plans/review-2026-11.md`: `uiStore` (617 lines), `PlanDialogs.tsx`, `TaskPage.tsx`, one component per file, no change in behaviour, all tests green. Task 13 of that plan (dead code: `Task.estMinutes`, the Anthropic leftovers in Settings, unused exports) is done here too.

---

## Progress

- [ ] 0 Try, commit and merge Plans and the AI queue
- [x] 1 Meeting notes are called Notes again (#6)
- [x] 2 The right panel shows only the open page (#7)
- [x] 3 An epic shows its plan; "area" is "epic" (#3)
- [x] 4 Complete menus and a key per area (#9)
- [x] 5 Review plan ticked, distrobox name (#21)
- [x] 6 Get started on the start page (#19)
- [x] 7 Tags in one place on a page (#10)
- [x] 7b The Actions column of a meeting is squeezed (found in phase 1)
- [x] 8 The epic page starts with Now (#11)
- [x] 9 Fewer Beta marks (#12)
- [x] 10 One way to write something down (#8)
- [x] 11 A project has a plan (#1)
- [x] 12 The project's overview (#2)
- [x] 13 A meeting belongs to a project (#4)
- [x] 14 An idea can go into a plan (#5)
- [x] 15 Decisions per project (#18)
- [x] 16 The assistant knows tasks, plans and meetings (#13)
- [x] 17 The assistant explains the app (#14)
- [x] 18 AI for meetings (#15)
- [x] 19 The AI button offers what fits the place (#16)
- [x] 20 The week, and a status report (#17)
- [x] 21 Split DECISIONS (#20)
- [x] 22 Load rarely used screens when they open (#22)
- [x] 23 Split the largest files (#23)
