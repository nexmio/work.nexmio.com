# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This list is kept short: it tells what Nexmio Work can do in each version. A small release that only fixed the one before it is folded into the last version of its series (for example 0.8.0 to 0.8.10 is one entry), and something that was removed and later came back is described only where it is in the app now.

## [Unreleased]

### Changed

- **You choose where a new page of a part goes.** **Link or make a page… → Make a new page…** offers a folder for each part (for example `Notes/Network/Switches`), and you can choose another.
- **Newest pages in a project's Overview** also shows pages with the project's tag, so a page you move out of the project's folder is still there.

### Fixed

- **A version is saved for everything you accept from the AI.** Ticked parts, steps, tasks and meeting items are in History at once, with the version from before them.
- **Ctrl/Cmd+Z takes back an AI change** that you accepted in the queue for a page that is open.
- **The comparison in History follows the page** when a new version is saved.
- **A table cell with a backslash before a `|`** is written so that other Markdown editors read it right.
- The chat's suggested question says "How do I make a project?".
- **The cursor lands on the line you choose.** On a page with properties, a table or a diagram, a click or the arrow keys could hit the line below, or skip a line, from there and down.

## [0.30.0] - 2026-11-20

### Changed

- **The AI engine is now part of Nexmio Work.** Before, the program that runs the AI was downloaded when you pressed Download, and the Microsoft Store version could not start it. Now it comes inside Nexmio Work (installer, Linux packages and the Store package alike), so the built-in AI works in the Store version too, and only the AI model is downloaded. Nexmio Work is about 30 MB bigger because of it.
- **One engine for every computer.** There is no longer a choice between "Graphics card" and "CPU only" to download: the engine uses the graphics card when there is one that works. To use only the processor, set **Use the graphics card** to "Not at all" under Settings → AI.
- **The same version everywhere.** The installer on GitHub and the package for the Microsoft Store are the same build. The extra test copy of the Store package is gone from the release.
- Uninstalling on Windows removes the engine together with the program.

## [0.29.0] - 2026-11-20

### Added

- **The AI knows your work.** Ask "What should I do next?", "What am I waiting for?" or "How far is the move?": it reads your projects, tasks and meetings to answer. Ask how something is done in Nexmio Work and it answers from the help, with a **Show me** button that opens the place. It can suggest tasks and parts of a plan for you to accept. An empty chat offers questions to start with.
- **The AI is a box over the right side.** **AI** in the top bar (or Ctrl/Cmd+L) opens the chat and the queue over anything, also the start page, which stays where it is. Esc or × closes it, and a half-written question is kept.
- **An AI button in Projects, Tasks, Meetings and on the start page**, with what fits there: find what a plan is missing, break down a part or the task to do now, find the decisions and actions in a meeting's notes (you tick which to add), suggest an agenda from the meeting before, or ask about a project, an epic or a meeting.
- **Look back** (Tasks → Look back): a week in one place, from Monday: what you finished and what moved on, the time logged, the meetings and their decisions, and the pages you wrote, for all projects or one. **Copy as a status report**, or let the AI **Write it for me**. **This week** on the start page shows the week so far.
- **Overview of a project:** next to Map and Outline, how far the plan has come and what to do now, the time logged this month, what waits for others, the project's meetings and decisions, and its newest pages. A meeting can belong to a project, and **To plan…** on an idea makes it a part of a plan.
- **Pin from the right-click menu.** **Pin** is in the right-click menu of a page (in the file list and on its tab), of an epic in Tasks, and of a task; a pinned task shows under Pinned on the start page and opens the task.
- **A note on a part of a plan.** Write a few words about what a part is for, without making a page for it. Right-click a box on the map and choose **Write a note…**: the note opens in the right panel, ready to write. The box shows **Note**; in the outline it is under the part's name.
- **Delete an archived plan.** **Delete plan…** in the plan's menu. Tick the plan's epic or the pages linked from it if they should go too. Everything is saved first, so Recover deleted brings it back.
- **A plan's tag.** A new project gets a tag from its name, shown in its settings, and it stays the same if you rename the project. The plan, its epic, and the tasks and pages you make from the plan get the tag, so you can find all of it at once.
- **Go to** on every job in the AI queue takes you back to where you asked for it.
- **Decisions** in the Meetings area: every decision of every meeting, grouped by project, with a search.
- **Get started** on the start page of a new vault: five small steps (a plan, its parts, a task, a timer, a meeting) that tick themselves as you do them.

### Changed

- **One way to make a project.** **New project** opens the same window from everywhere (it makes the project and its plan). There is also **+ New project** at the bottom of the projects list, **New project…** in the right-click menu of an empty place in the projects list and the Pages panel, and an arrow ▾ next to the New button at the top of the navigation that lists a page, a task, a project, a meeting and an idea wherever you are.
- **Nexmio Work's own tags are not mixed up with `#tags`.** `#meeting`, `#epic`, `#pinned` and `#plan` are no longer offered after `#`, because written in the text they do nothing. Written anyway, the tags line says so and has a button (for example **Make this page a meeting**) that puts the real tag on.
- **Plans is now Projects.** The list shows each project with how far its plan has come; a project without a plan has **Make the plan**. A plan opens on the map, and Plans are no longer in beta (the AI still is).
- **The AI never locks the screen.** **Suggest parts** and **Break it down** in a plan, **Break it down** on a task, **Find tasks** and **In short** run in the AI queue, like the commands on text. The queue opens by itself, and every job has **Go to**. You can work on while the AI answers, and tick what to keep.
- **Break it down in a plan looks at the whole plan.** The AI reads every part, the plan's page, the pages linked to the part and the plan's tasks. It suggests only what belongs to the part you chose.
- **Plans are easier to work in.** **Rename** and moves with words (**Earlier**, **Later**, **Under the one before**, **One level up**), **Repeat these steps** draws what it will make, and **Add parts** has an **Add** button.
- **A page's tags are in one place:** the row above the text, where a `#tag` written in the text shows too (marked "in the text"). An epic's tags stand next to its name.
- **Landing is now called Inbox** in the Pages panel, and the panel has no New button of its own. **Open the page** of a meeting is in its **···** menu, so the meeting's name has room.
- **The built-in AI is in the Microsoft Store version too.** The Store version and the version from GitHub are now the same.
- **Tasks groups the epics by project** at the left, and an epic made for a plan says so, with **Open the plan**. **Go lists every area**, and **Ctrl/Cmd+1 … 6** open Start, Pages, Tasks, Projects, Meetings and Ideas.
- **The right panel shows the page tabs only when a page is open.** In Tasks, Projects, Meetings, Ideas and Time it no longer shows the outline, tags or history of a page that is not on the screen.
- **The start page opens faster:** rarely used windows and screens (Settings, Help, Projects, Look back and more) are loaded only when you open them.

### Removed

- **Quick page.** Write it down asks for a task or an idea, and a page is New → Page. Pages you already have in the Quick pages folder stay where they are, and the folder is now where an idea goes with **To page** (Settings → Vault).
- **Making or linking an epic on a part of a plan.** A plan has its own epic, where the tasks made from it go, so a part is tied to a task or a page. A part that was linked to an epic before still shows it.

### Fixed

- **A new vault shows in the vault list at once**, so you can switch between it and the others without restarting. A vault that cannot be opened leaves the one you are in open.
- The buttons in the right panel of a plan's map work. **Add a part** there did nothing before.
- The tasks under **Actions** of a meeting are readable when the column is narrow (the title wraps, the date goes under it).
- A meeting's text is called **Notes** again on the meeting screen, in the Meetings area and in the help (it said "Pages").
- Parts arranged in a stack no longer go back to side by side when the part gets a page, a task or an epic, or is renamed.

## [0.27.0] - 2026-11-19

### Added

- **A timer for tasks.** Start it under **Tasks → Time** on a new task or on one you have. While it runs, a **Timer** tab in the right panel and a clock in the status bar keep going beside the page you are writing. When you stop it, one line is added to the task's log, like `⏱ 1 h 20 min · 09:00–10:20`, so it is ordinary text in the page.
- **Time.** A new view at the bottom of the Tasks panel shows what each task took. Choose a tag and a period, see it by task or by day, and copy it as CSV for an invoice or a time sheet.
- **Loose tasks.** A timer can start on a task with no epic. It goes into the page **Loose tasks**, and **Move** on the task page or in the right panel puts it into an epic with its steps and log.
- **Tags on tasks and epics.** The same tags as on pages. Add them in the right panel, on the task page or on an epic; a tag on an epic counts for all its tasks. At the top of the Tasks panel you can show only what has a tag.
- **Tags on a whole folder.** Right-click a folder or a project and choose **Tags** to put a tag on every page in it, or take one off. The window says how many pages change first, and History can bring them back.
- **Your tags** (File menu). See the tags you use, make a new one, find everything that has one, or delete one everywhere after Nexmio Work has said how many pages and tasks change.
- **Search finds a tag.** Search for a tag, with or without `tag:`, and you also get the tasks that have it, and are told that it is the tag that found each one.
- **Save a version when you want.** Settings → Version history can save a version when you close a page, and every so many minutes while you write.

### Changed

- **The built-in AI runs on the graphics card (Vulkan) or the processor, and that is the whole choice.** The CUDA, ROCm and SYCL engines and the boxes for processor and graphics card are gone. What you chose before is read as the graphics card.
- **Settings → AI has three choices:** the built-in AI, an AI of your own on this computer (LM Studio and others), and a cloud AI, which you turn on yourself after being told that your pages are then sent to it.
- A task opened as a full page is only there, and **Back** goes to where you came from. If the right panel was shut and the task opened it, the full page shuts it again.
- Settings → **Tasks and time** (it was Tasks and focus).

### Removed

- **Focus and Ultra focus** are replaced by the timer.
- **Foundry Local and the AI built into Copilot+ PCs (Phi Silica).** They translated wrongly and some models did not run. Settings that chose one of them use the built-in AI instead. The Microsoft Store version has no built-in AI for now, but works with LM Studio or a cloud AI.

## [0.26.0] - 2026-11-17

### Changed

- A plan always lives in a project. **New plan** asks **In a new project** or **In a project I have**, and a project without a plan is offered **Make a plan** in the Plans panel. Plans are listed under their project. A plan made before this can be moved into a project.
- Each project in Files says whether it has a plan: **Open the plan**, or **No plan yet · Make a plan**.
- A small trail above an epic and a task shows where it belongs (project › the page it was made from › epic), and each step takes you there.
- Settings → AI shows two AIs at once: the **Main AI** (what everything uses, also a cloud AI) and the **Local AI** (always on your computer, used by projects marked Local AI only). Project settings say which AI the project uses.
- The Dark theme has new colours: surfaces with a little blue-violet colour, clearer steps between the page, panels and cards, and visible borders. It is calmer to look at, and purple is kept for buttons and marks.
- Right-clicking an empty place no longer shows a menu with only "Inspect element". A new **Debug mode** (Settings → About) adds "Inspect element" to every right-click menu; it is off by default.

### Fixed

- Opening a task or an epic from somewhere else (a plan, the start page, a search, a page) now brings the Tasks list to the left, so the left panel and the page in the middle always belong together. The same goes for a meeting, an idea and a plan.
- A Foundry Local model that cannot call tools no longer ends the chat with the error "structured tool calling requires model-published … tool markers": Nexmio Work asks again without tools and the chat answers as plain text.
- The "New page" button at the top of the left panel now opens the dialog for a new page.
- The name that shows when the mouse rests on an icon in the left panel now has a solid background, so text behind it no longer shows through.

## [0.25.0] - 2026-11-15

### Added

- **Mimer is now Nexmio Work.** New name, new look, and the AI is simply called the AI. Settings start fresh.
- **AI works in the background.** An AI command on selected text is added to the **Queue** tab of the AI instead of locking the screen. The AI takes them one at a time, you can work on another page, and when an answer is ready you accept it there: Nexmio Work opens the right page and writes it. The window no longer disappears when you click outside it.
- **Plans: a better map.** Right-click a part that has parts under it and choose **Arrange the parts**: side by side, stacked, or in a grid of any number of columns or rows (for example nine parts in 3 columns); the one in use is ticked, and choosing one lets go of places set by hand under that part. Boxes can be dragged (their parts follow), the map moves when you drag the empty space and zooms with the mouse wheel, and **Tidy up** puts everything back. Text in the boxes is centred, and a part that is tied to a task, a page or an epic shows small **Task**, **Page** and **Epic** buttons under its name.
- **Plans on the start page.** A new widget lists the plans that are going.
- **Draw a diagram yourself.** A new help topic, **Diagrams (Mermaid)**, has examples to copy (flows, talks, steps, timelines, schedules, pies, mind maps) and links to Mermaid's own guides. A big diagram in an AI answer can be zoomed and made taller.
- **Meetings: write an agenda point in the notes.** A small arrow on each agenda point writes it on a new line at the bottom of the notes.

### Changed

- **A new layout.** The navigation at the left has a name beside each icon (and folds to icons with **Collapse**), a button at the top makes the new thing of the area you are in, and search is a field in the middle of the top bar. The AI status is at the top right. The chat is the **AI** tab of the right panel, beside the page instead of over it, and the right panel has tabs (Outline, Links, History, Images, AI). The formatting buttons are in one row, and the tags of a page are in a line of their own.
- **The pages area is called Pages** (the navigation, its list and the **New page** button).
- **Tasks one area at a time.** Choose an epic at the left and see only that: the task to do **Now** with its next step, then **After that**, **Waiting for others** and the done ones folded away. The filters, the folded cards and the quiet list are gone. The chosen task is shown in the right panel.
- **Meetings:** the calendar is folded to one line, with a search box and the groups Today, Coming and Earlier; the meeting page has pages and decisions beside the agenda and actions, and one main button, **Start meeting**.
- **Ideas are cards** in three columns (Open, Used, Archived), with a line at the top to write a new idea.
- **Plans:** the map is the same, but the chosen part is in the right panel, with its actions in groups (Parts, Link to, Arrange the parts, Move). With no plan open you can start an empty plan or one from a project.
- **Settings** has seven sections (Appearance, Editor, AI, Tasks and focus, Pages and backup, Shortcuts, About), sliders with a preview for the text, and changes apply at once, with **Undo the last change**.
- **The start page** has a **Today** card (the next meeting, what you are doing and waiting for, and where you left off) and up to three columns.
- **Small headings are no longer in capital letters, and a done task is dimmed, not struck through,** so the text is easier to read.
- **A new look.** Light and Dark are now Nexmio Work themes with purple buttons and marks, and Dark is the first theme you see. The start page greets you on a purple banner, the welcome screen and About follow the theme, and the name is drawn as a wordmark, also in the top bar.
- **Renamed from Mimer to Nexmio Work:** new name, app identity (`com.nexmio.work`), program and file names. Settings are not carried over from Mimer.
- **Plans: two parts under the same part cannot have the same name** (they were taken for one on the map). The same name under two different parts is fine.
- **Plans: "idea" is now "part", and "Finish" is "Archive plan".** An archived plan is listed under **Archived** and can be opened again.
- **The AI answer shows only the new text.** What it was before is behind **Show the original**.
- **The page "AI can make mistakes" has its own line** in the AI box, so it can be read.

### Fixed

- **Foundry Local on AMD:** when one hardware part (for example the AMD graphics card) cannot be set up but others can, Nexmio Work goes on with the ones that work instead of stopping with an error.

## [0.24.2] - 2026-11-12

### Added

- **Plans.** A new area for breaking something big down. A plan is an ordinary note (with the tag `plan`, in the folder Plans) whose list is a tree of ideas, shown as an **outline** or as a **map**. **Break it down** takes you through three short steps (what is it, what are the parts, where to start), the AI can **suggest parts** for you to tick, and an idea can be made into an **epic** (its sub-ideas become tasks), a **task**, or tied to a **note**. **Repeat these steps for…** gives every supplier, product or customer its own branch (and epic) with the same steps. A plan can be **finished**, or the open ideas carried over to a new plan. There is no timer. Every tie can be an existing epic, task or note, or a new one, and **Repeat these steps for…** makes one task for each name in the epic of the plan, with the steps as the steps of that task. The map is drawn from the top down, with right-click menus. You can write a whole tree down at once: **Enter** adds an idea, **Tab** makes the next one a smaller part, **Shift+Tab** goes back up, and a pasted indented list becomes a tree; nothing has to be tied to anything until you want to. A new plan can get **a project of its own**: a folder with the name of the plan, with the plan note in it, and the epics and notes made from the plan kept in its `Epics` and `Notes` folders. A project that is there can be made a plan too (**Plan from a project…**, or right-click it in Files), with its notes and epics as ideas to start from; a project never becomes a plan by itself. Plans are marked **Beta**: still being built.
- **Names on the icons.** Rest the mouse on an icon in the left bar and its name shows next to it. Plans now sits under the house, and Ideas is last.

## [0.23.1] - 2026-11-12

### Changed

- **Load AI and Unload AI** replace Wake and Sleep for the built-in AIs, in the status bar, in the settings and in the messages. The settings of Foundry Local and of the built-in AI now have the same two buttons, so a model can be unloaded from there, and "Sleep after" is now "Unload after".
- **The Foundry Local models are in a drop-down.** The chosen model is shown in a box; pressing it opens a panel with the search, the filters and the list, which scrolls inside the panel, so the settings are no longer a long list.
- **Foundry Local is updated** (version 2.4.1, with a newer AI engine inside), which is what Microsoft advises for the crashes some AMD computers had with the neural processor (NPU) and with new models. It has not been tried on such a computer yet.

### Fixed

- **A menu that ran off the screen.** The right-click menu in a note and the AI menu over selected text now stay on the screen, and the AI menu scrolls, so the last entries can always be chosen.
- **Draw as a diagram** now shows the proposal drawn as a diagram, with its code under "Show the code", before you add it under the text.
- **When Foundry Local's engine crashes** while an AI is tested, Nexmio Work says so at once, with the code in words ("access violation") and what to try (a model for the graphics card or the processor, and updated drivers), instead of waiting two minutes.

## [0.23.0] - 2026-11-12

### Added

- **A taskbar helper (Windows).** An icon in the taskbar and keys that work in every program: **Write something down** (Ctrl+Alt+N) opens a small box for a task or an idea, and **Where I left off** (Ctrl+Alt+P) writes one line about the next step on the task you work on. It is off until you turn it on in Settings → General, you choose the keys yourself (and are told if another program already uses them), and Nexmio Work can stay in the taskbar when you close the window. On other systems it is greyed out.
- **Nexmio Work keeps its own bookkeeping outside your notes.** Which notes are pinned, what a task waits for and the history of its status changes are kept in `.vault/meta.json`: plain text, in your vault's history and backup, and no longer as a tag or as words in the note. Nexmio Work asks before it moves anything from an older vault (**Move them now**, after saving the notes in History); until you do, everything works as before, but the next version only reads the new place.
- **Say what a task waits for.** On a task that is Waiting you can write who or what it waits for, and pick the task it waits for. That task says which tasks wait for it, and the waiting task says **Ready** when it is done.
- **A clearer task list.** Filters (All, Doing, Waiting, Next up), folded epics as small cards with what is next and what is waited for, and epics where nothing has happened for 14 days under their own heading.
- **Where you left off.** When you leave Focus, Nexmio Work asks "What is the next step?" (one line, optional). It shows on the task and on the start page's Continue card the next time you come back.
- **In short.** AI → In short gives the main points of a long note and the things to do. Nothing is written to the note, and only the things you tick become tasks.
- **Draw as a diagram.** Select a text that describes a flow, and the AI menu proposes a Mermaid diagram next to it, which you can add under the text or copy.
- **Reading settings.** Settings → General → Reading changes the space between lines and letters, the font, and **Follow the line**, which dims every line but the one you are in. A choice shows at once, and Cancel puts it back.
- **Test it.** Under an AI that is set up in Settings → AI: one short question, with none of your notes, and the answer, or the error in plain words that can be copied into a bug report.

### Changed

- **Done tasks sit last in their epic**, under Done, on the task list and on the epic page. The arrows move a task past the open tasks only.
- **One place to choose and set up the AI.** Each row in Settings → AI has its own setup under it when it is chosen. The built-in AIs are marked Beta, and none is recommended over the others.

## [0.22.0] - 2026-11-09

### Added

- **Backup of a vault.** **Settings → Vault → Backup** copies your notes and their whole history to a folder you choose (an external disk, or a synced folder): **Back up now**, and optionally when Nexmio Work closes. The status bar warns when the last backup is a week old or failed. Nexmio Work sends nothing anywhere, and the backup never overwrites a folder that holds another history.
- **What's new.** The first time a new version starts, a small window lists what is new in it (from the changelog that comes with the program, so nothing is fetched); **Help → What's new** opens it again. It never comes the first time Nexmio Work runs on a computer.
- **A demo vault.** On the welcome screen, **Try the demo vault** makes a small example vault (notes, an epic with tasks and a log, and two meetings dated today and tomorrow) in the folder you choose and opens it. A folder called `Nexmio Work Demo` that is already there is opened as it is and nothing is written to it.

### Changed

- **The task list is faster in big vaults.** Nexmio Work remembers what each note's tasks were and reads a note again only when it has changed (about six times faster on 2000 notes), and many screens asking for the list at once share one read.
- Diagrams are drawn with a newer Mermaid that fixes known security faults.

### Fixed

- **Focus:** a log entry's text now lines up with its date.
- **The start page** no longer shows list marks (`-`, `1.`, `[ ]`) from the note in "Continue".
- **The privacy policy now describes the optional cloud AI** (it said notes are never sent to a cloud service).
- The small previews on the theme cards no longer run text into each other.
- **The README is rewritten** as the longer, technical page (what Nexmio Work does, how notes are stored, the two editions, install, AI set-up, build), with new screenshots. The website stays the short overview; the sentences they share are in `docs/shared-facts.json` and a test keeps them the same.
- **The website no longer says Nexmio Work checks for updates by itself** (it does not): it points to **Help → Check for new version…**.

## [0.21.0] - 2026-10-31

### Added

- **Your own tags.** **···** → **Tags…** on a note has **Nexmio Work uses these** (Meeting, Epic and Pinned, each with what it does) and **Your tags**: add any word, take it off again, or click a tag you already use on another note. Above the note Nexmio Work's tags are filled and yours are outlined with a `#`. **Search** lists the two kinds in two groups, and a click searches for `tag:name`. The AI never adds or takes away Meeting, Epic or Pinned.

### Changed

- **Meetings: one text for the notes, and parts you choose.** You write the notes in one text all through the meeting and can always read them; the agenda is a checklist beside it. **Agenda**, **Decisions** and **Actions** (tasks that also show in Tasks) are options, off until you tick them when you make the meeting, in the meeting, or under **Change…**. Older meetings keep their notes and have all three parts.
- **Pick a time from a list** of every quarter of an hour, or type it as before.

### Fixed

- A click in a box in a window opened from the editor toolbar (Tags…, Rename…) now focuses the box.

## [0.20.0] - 2026-10-30

### Added

- **Two editions: Preview and Stable.** Nexmio Work is now **Preview** (0.x and later `1.x.y-preview.N`): the newest features, changing often. **Stable** (v1.0.0 and later) is the finished release and is not out yet; until it is, the 0.x releases are the ones in the Microsoft Store.
- **Help → Check for new version…** opens the releases page in your browser. Nexmio Work never looks for updates by itself and sends nothing.
- **A website** with what Nexmio Work is, the two editions and where to download them.
- **Eight themes.** **Settings → General → Theme**: Light, Dark, Slate, Paper, Mint, Midnight, Graphite and Ember, shown live, or follow the computer's Light or Dark.
- **Markdown in the boxes where you write more than a line** (the note of a task, an epic and an idea, a task's log, a meeting's notes, a quick note): bold, lists, Tab and Ctrl+B / Ctrl+I work as in a note.
- **Focus** has a **Timer** you can turn off, any length (15, 25, 45, 60 or 1–180 minutes), and **Ultra focus**: only the task you work on, with its steps and log.
- **AI instructions made clear.** **Settings → AI** has **About me and my notes** and **Language of the AI's answers**; a project has **About this project**. The fixed commands (Fix, Rewrite, Shorten…) no longer read these texts.

### Changed

- **Meetings** show the time on every meeting, and **Next meeting** on the start page lists today's and tomorrow's meetings with Start.
- **With no note open, Files shows a Notes page** with the recent notes and every note, and a box to narrow the list.

### Fixed

- The AI no longer leaves "Here's the revised version:" or "Let me know if you want changes" around its answers, also in Danish.

## [0.19.0] - 2026-10-28

### Added

- **A start page you build yourself.** The house at the top of the left edge opens it, and it shows when no note is open. **Customize** adds, removes, moves and widens widgets (Continue, Recent, Pinned, Write it down, Search and ask, Next meeting, Working on, To sort, Areas, Changed since yesterday, Epic progress). The layout is kept per computer; **Settings → General → Open the start page when Nexmio Work starts** is off by default.
- **Pin a note** from its **···** menu; it is listed under Pinned.
- **A Meetings area** (the calendar clock at the left edge): a calendar with a dot on the days with a meeting, then Today, Upcoming, Past and No date. A meeting shows its agenda, its tasks and its notes, with **Start meeting**, **Prepare next…**, **Change…**, **Delete** and **Open the note**. A meeting is a note with the tag Meeting.
- **One box per kind of thing written down:** Quick note, New task and New idea each open only their own box. **Ctrl/Cmd+Shift+N** asks first. In a meeting, in Focus and on the start page, **+ Task**, **+ Idea** and **+ Quick note** keep the box open for the next one.
- **Tab and Shift+Tab** move a list item in or out, also in the boxes outside the editor.
- **Status on a task row** (Doing, Waiting, Dropped) as a small label.
- **Time format** in **Settings → General**: System, 24-hour or 12-hour. A time can be typed as `14:30`, `1430` or `2:30 pm`.
- **A UX guide** (`docs/UX-GUIDE.md`) with the design system every screen follows.

### Changed

- **Foundry Local asks before downloading the hardware parts:** **Download and find my hardware**, or **Use only the processor**, which downloads nothing.

### Fixed

- A new meeting is for today unless another day is picked.
- Mermaid diagrams are also drawn from a fenced block with no language that starts with `graph TD`, `sequenceDiagram` and the like.

### Removed

- Your own templates (**From a template…**, **Save the note as a template…**). Meeting, quick and daily notes still start from their templates in `.vault/templates/`.

## [0.18.0] - 2026-10-27

### Added

- **A note for a task.** The task page has **Linked note**: **Link a note…** or **Make a note for this task**. The link is a `[[wiki-link]]` in the task's own line, so it works in any editor and follows a rename.
- **Tags on a note: Meeting and Epic.** The **···** menu above a note (Rename, History, Tags, Export) has **Tags…**; the tag is written in the note's properties. A note tagged Meeting gets **Start meeting**; a note tagged Epic is listed with your epics.

### Changed

- **The tag decides what is an epic.** A note without the tag only keeps its `- [ ]` lines under **Tasks in other notes**, each with **Make an epic**.
- **The agenda of a meeting note is not tasks.**

### Fixed

- Adding an item to a meeting that had no agenda now works.

## [0.17.0] - 2026-10-26

### Added

- **Choose the epic of a task** with **Into** in the write-it-down box (the epic of the meeting, the one used last, any other, or **+ New epic…**).
- **Pencil and waste bin** on epics, tasks and steps. Deleting an epic or a task asks first; a step is deleted at once with **Undo**.

### Changed

- "Epic task" is now just **Epic**.
- **Prepare next meeting…** carries over the agenda items that were not reached.

## [0.16.0] - 2026-10-26

### Added

- **Meetings.** **New → Meeting note…** asks for a title, a day and time, who is with you and an agenda (all optional) and saves an ordinary Markdown note. **Start** opens the meeting screen with the agenda, the notes and the write-it-down box. The next meeting shows at the top of Landing. **Prepare next meeting…** fills in the window for the next one.
- **Right-click on selected text** shows Cut, Copy, Paste and Select all, then **AI ›** and Add as a task or idea.
- **A Beta mark on the AI**, and a first-start notice saying the AI is a first version.
- **Focus** can add a step under any task and move tasks and steps.

### Changed

- **Focus is one button, on the epic.**
- **Quick note** opens the write-it-down box and saves in Quick notes without moving you away.
- **Settings has one AI tab:** the choice of AI, then the folded sections for the built-in AI and for LM Studio and other providers.

### Removed

- **New note from a starter** (Meeting, Status update, Reply to an e-mail, Idea).

## [0.15.1] - 2026-10-24

### Added

- **Every Foundry Local model** it can run on this computer, each with what it is good for, size and licence, with search and filters. A model without tools can be used for text commands and the chat about the open note.
- **Which AI Nexmio Work uses**, as one list at the top of Settings → AI, in the order that suits where Nexmio Work runs, with its state and a button to where it is set up.
- **Cloud AI as a last resort.** Nexmio Work says what is sent and that it is your responsibility, and uses it only after you tick "I understand". The status bar shows **Cloud AI** while it is on.
- **Local AI only** for a project: its notes never go to a cloud AI.
- **"AI can make mistakes. Check the answer before you keep it."** under the chat and in every review.

### Fixed

- Translate no longer keeps the text in Danish.
- Some Foundry Local models (such as SmolLM3) no longer fail with "Unknown method: replace".

## [0.14.1] - 2026-10-24

### Added

- **Focus on a whole epic.** Every task of the epic is one outline; the task you work on is open and marked (its status becomes Doing) with its steps and a box for what has happened, which goes into the log with today's date.
- **Your own order for epics, tasks and steps** with the arrows or **Alt+↑** / **Alt+↓**.
- **Phi Silica on Copilot+ PCs** (Microsoft Store version): the small model built into Windows runs on the neural processor with nothing to download. Settings → Built-in AI explains what Windows says about access, the PC and the model.
- Change a step's text on the task page.

### Fixed

- Focus: the buttons under the timer no longer run out of the window.
- Phi Silica's "the package lacks a permission" message.
- Renaming a task no longer removes its `made:` date.

## [0.13.0] - 2026-10-21

### Added

- **AI in every text box.** Select text in any box and a small bar offers Fix, Rewrite, Shorten and more; **Ctrl+K** works on the selection or all the text.
- **A note on a task and on an epic**, kept as plain text in the note, and **edit and delete a line in "What has happened"**.
- **Trace my work** (Settings → General, off by default; can also be chosen when you make a vault): one line a day for each note you write in and each task you make, work on or finish, under "Worked on" in today's daily note.
- **Let the AI check its own answer** (Settings → AI, off by default).

### Changed

- **New licence: AGPL-3.0** (was Apache-2.0). Nexmio Work stays free for everyone, also companies; if you share your own version you must share it with its source under the same licence.
- **Tasks are an outline of epics, tasks and steps.** Every epic folds to one line with its progress, and finished epics are folded together under **Done**. There are no due dates and no Today: every task gets the day it was made (`made:2026-10-21`).
- **A task page in two columns**, and a task's file that reads well in any editor (the log as dated list items).
- **A calmer, more consistent look:** no "Back to notes" buttons, panels that follow what is on screen, one name for each thing, and a layout that fits a narrow window.
- **Names Windows cannot keep are refused** when you make or rename a folder, note or project (a dot at the end, `CON`, `NUL`, and the characters `\ / : * ? " < > |`).

### Fixed

- Thinking out loud and lead-ins like "Revised text:" are removed from the AI's answers.
- An answer that would delete the text is never offered as a replacement.
- A sleeping built-in AI is woken by the text commands too.

## [0.12.0] - 2026-10-20

### Added

- **Epics.** An epic is a note with tasks in it, shown as a box with progress ("2 of 4") that can be folded. A task made from another note goes into an epic of its own; **Suggest steps from the note** lets the AI propose steps you choose from.
- **Landing.** Meetings, Quick notes and Tasks are kept together above the projects. New notes there have a NEW mark for a week.
- **Daily notes on a calendar** at the top of the Files panel.
- **Mermaid diagrams** are drawn from a fenced `mermaid` block.
- **Tag suggestions** when you type `#`, and the tags of the note in the Outline panel.

### Changed

- The Tasks panel lists the epics. Folding an epic replaces the old filters.

## [0.11.0] - 2026-10-19

### Added

- **Tasks.** A task is a checklist line in any note (`- [ ] Renew the licence`). Nexmio Work reads them in every note and shows one list (Ctrl/Cmd+Shift+T). A task has a status, steps, and a log of dated lines; **Break it down** lets the local AI propose steps you choose from. Everything is written back as plain Markdown.
- **Focus on a task:** one step at a time, a timer, **Help me start** (the AI suggests one tiny first step) and a box to park a thought.
- **Ideas**, an area of their own (the light bulb at the left edge): a dated line you can turn into a task or a note, archive and bring back.
- **Write it down** (Ctrl/Cmd+Shift+N): one box for a task, an idea or a note.
- **AI where you work, with fixed commands instead of a chat to type into:**
  - Selected text: Fix, Rewrite and Shorten, and more under **AI ▾** (simpler words, more formal, friendlier, a list, translate, **Explain this**, **Find tasks in it**). A rewrite shows whether its numbers, links, addresses and tags are all still there.
  - The whole note: an **AI** button with fix spelling, tidy the structure, a short summary, a title and tags, find tasks, split into notes and an e-mail from the note.
  - **Search** shows **Answer from my notes** when the search reads like a question.
  - **Spelling help** for dyslexia, which marks misspelt words (also in Danish) and never changes anything by itself.
- **Everything else works without an AI.** Every AI button is greyed out and says why.
- **The right side is a narrow row of icons:** Outline, Links (with *Maybe related* notes), History and Images.
- **Make an index page** for a folder (right-click) without AI.

### Changed

- **The chat is only a chat.** It reads and searches your notes but can no longer change them, and opens as a window (Ctrl/Cmd+L) instead of a column.
- **The menus are File, Go and Help**, and every menu, panel and page has one look.

### Fixed

- Pictures survive moving a note, and tabs with the same name show their folder.
- The start screen is a small window of its own, and the app opens at the size and place it had.
- New app icon and start picture.

## [0.10.2] - 2026-10-18

### Added

- **Skills.** A skill is a job Nexmio Work carries out itself, note by note, so it works with small local models. Nexmio Work finds the notes, asks the model for one step at a time and builds the proposals itself; you review every change before anything is written. Kinds: rewrite each note, sort notes into folders, write one new note, or answer in the chat. Eleven come with Nexmio Work (fix spelling and grammar, improve the structure, sort into folders, summarise…).
- **Right-click a note or folder → AI** runs a fitting skill at once.
- **Nexmio Work checks every change** (links, tags, numbers and dates, names, properties, code), and a change that fails a check is shown but not selected, with the reason. **Fix small mistakes** only sends back "wrong => right" for the words to fix. Long runs start with three notes, then ask **Looks good, do the other N**.
- **A local AI must be running** before a skill starts (a built-in AI awake, or LM Studio answering); otherwise a message says what to start.
- **A new look for working with the AI:** an AI chip in the status bar, a **Review changes** screen with filters, group accept and **Undo**, a command palette (Ctrl/Cmd+Shift+P), a left icon bar, a bar over selected text, and a short welcome when there is no AI yet.

### Fixed

- Stop during a skill no longer proposes half an answer, and a skill started with nothing chosen does not run on the whole vault.
- The Windows build of 0.10.0 failed because two file names differed only in upper and lower case; use 0.10.2.

## [0.9.4] - 2026-10-16

### Added

- **Foundry Local as a built-in AI.** Settings → Built-in AI asks which engine should run the AI on this computer: **Foundry Local** (Microsoft's runtime, which picks the best hardware by itself, including a neural processor, and offers Qwen, Phi and Gemma) or **llama.cpp**. It runs in a helper process, so a fault cannot take Nexmio Work down. It is the only built-in engine in the Microsoft Store version. Windows 11 24H2 or later is needed on Windows.
- **Find my hardware** downloads the hardware parts (no model) and reads the model list again, so NPU and graphics models are listed.

### Changed

- **Settings → AI providers** lists the built-in AI as one entry, whichever engine it uses.

## [0.8.10] - 2026-10-16

### Added

- **A built-in AI: Nexmio Work without LM Studio.** **Settings → Built-in AI**: choose your processor and graphics card, pick a model (Gemma 4 12B recommended) and press **Download**. Nexmio Work downloads llama.cpp's `llama-server` and the model, checks them against fixed checksums, and keeps them in its own folder. The engine is chosen from the graphics card (Vulkan, CUDA, ROCm, SYCL or CPU only). You can add your own `.gguf` file.
- **Wake Nexmio Work / Sleep Nexmio Work.** Wake loads the model into memory; Sleep unloads it. The message box is locked until Nexmio Work is awake, and Nexmio Work can sleep by itself after idle minutes. The engine never outlives Nexmio Work, listens on `127.0.0.1` only, and the uninstaller (Windows) or **Remove files** (Linux) deletes it.
- **Clear problems.** When something fails (memory, a driver, a missing runtime, a busy port, a damaged model, a failed download) Nexmio Work says what happened, gives numbered steps, and has the engine's last lines under **Show details**.
- **Settings for the built-in AI:** context size, graphics card use, threads, flash attention, thinking and sleep after idle time.
- **Add provider asks which kind first,** and every kind of provider explains what to do. **Switch AI and model in the tab** from a menu.
- **A Microsoft Store package** (MSIX), with a privacy policy (`PRIVACY.md`) and a **Report inappropriate AI content** link, which the Store requires. The Store version is called **Nexmio Work** and uses Foundry Local; llama.cpp cannot be downloaded there.
- **Markdown source view** (**Ctrl/Cmd+Alt+M**), and **Report a bug** and **Suggest a feature** in the File menu with the version and system filled in.
- **The new app icon** (the gold M on a dark tile).

### Changed

- **A project is always a new folder in the vault root.** **New → Project…** asks for a name and makes both at once.
- **Pictures are listed in the Images tab only,** not in the file tree.
- **Settings → Built-in AI explains the download** before you press the button.

### Fixed

- Links did nothing in the Linux AppImage; Nexmio Work now opens them itself.
- Sorting a big folder (for example a OneNote import) no longer goes in circles.
- Web links in notes and the report button no longer say "not allowed to open".

## [0.7.1] - 2026-10-15

### Added

- **A beta mark** in the status bar, the start screen, About, Settings and the window title. GitHub releases are marked as pre-releases.

### Changed

- **A new note is named the same way everywhere:** one small window asks for the name. A name that is taken is explained while you type, and a move onto a taken name stops with a window you have to close.

### Fixed

- Two things could have the same name in one folder (`Docs` and `docs`, or a note `Work` next to a folder `Work`), and two projects could have the same name; both are now refused, in the backend as well, so a vault works the same on Linux and Windows.
- Release builds showed the editor without its styling.
- A vault that was deleted, renamed or moved on disk is marked "Folder not found" and can be removed from the list or located again.

## [0.6.0] - 2026-10-14

### Added

- **Attach a note or a whole folder** to a message with `/` (the first 40 notes of a folder).
- **My own order** in the file panel: drag a note or folder, or use **Alt+Up / Alt+Down**; the order is saved in `.vault/order.json`.
- **Select several files and folders** with Ctrl/Cmd+click and Shift+click, then move or delete them together.
- **Reuse a picture** from the Images tab with **Insert in note** or by dragging, and look closer by clicking a picture.

### Changed

- **Projects have their own tree** under **Projects**, with a **+** button, project settings and drag and drop; links work across the project border.
- **The attachments folder is not listed in All files;** pictures are in the Images tab.
- **Recent** shows 4 notes by default, and the number is a setting.

## [0.5.0] - 2026-10-13

### Added

- **A how-to guide** (**?**, **F1**) with a search box, and small **?** hints next to settings and tools.
- **A new note is named by its title:** type `# Weekly sync` and the file becomes `Weekly sync.md` a moment after you pause.
- **Pictures in notes:** an **Insert image** button, dragging a picture in, a size bar (Small, Medium, Large, Original), and an **Images** tab with every picture and the notes that show it.
- **A clearer file panel:** one **New** menu, a filter box, **Collapse all**, sort by name or last change, note counts, a **Recent** section and a breadcrumb above the note.

## [0.4.0] - 2026-10-13

### Added

- **Meeting and quick notes.** A new vault has a `Meetings` and a `Quick notes` folder with their templates; two buttons make a meeting note or a quick note. **Settings → Vault** changes the folders and can add them to an existing vault.
- **Switch between vaults** from the vault name in the header (**Ctrl/Cmd+Shift+O**), with recent vaults, open another folder and create a new vault.
- **Index pages:** right-click a folder → **Create index page**, a note with a link to every note in it. Run it again to refresh it; your own text stays.
- **Link to a note** (**Ctrl/Cmd+Shift+K**) searches the whole vault and inserts `[[…]]`.
- **Merging notes** is one proposal: the new note plus the deletion of the source notes, all or nothing.

## [0.3.0] - 2026-10-13

### Added

- **A formatting toolbar** above the editor: bold, italic, strikethrough, code, headings, lists, quote, links, table, code block and line. The tools toggle and keep the selection.
- **The AI is called Nexmio Work.** Attach notes to a message with `/`; the answer shows what is happening (waiting, writing, "Reading Work/Plan.md…", the step of a longer task).
- **Import notes from a folder** (File → Import notes from folder…), made for the Markdown output of a OneNote exporter. It previews, never overwrites, cleans names Windows does not allow, reports broken links and can be cancelled (`docs/IMPORT-ONENOTE.md`).
- **A start screen and About**, with the Nexmio Work picture and the version.

### Fixed

- Bold, italic and the other wrap tools no longer put the marker across a line break or around spaces.

## [0.2.0] - 2026-10-13

### Added

- **Chat history** per vault (not committed to Git).
- **Daily notes** (`Ctrl/Cmd+Shift+D`) from a template, and a Vault settings tab for folders and date format.
- **Tabs and a split view:** several notes as tabs, a second pane (`Ctrl/Cmd+\`), and tabs restored per vault.
- **A table editor:** Markdown tables are editable tables when the cursor is outside them.
- **Export** of a note or folder to HTML, Word (`.docx`) and PDF.
- **Semantic search:** optional search by meaning with embeddings from LM Studio, in modes Keyword, Meaning and Both.
- **The version is shown in the app** (status bar, welcome screen, Settings) with the commit, so you can tell exactly which build you are testing.
- A start guide for Linux and Windows (`docs/START-GUIDE.md`).

## [0.1.0] - 2026-10-13

### Added

- **The first version:** a three-column app with a vault and a file tree (create, rename, move, delete, a file watcher), a live-preview Markdown editor with saves and conflict handling, a local Git history of every change (restore a version, recover a deleted note), wiki-links, backlinks and tags with automatic link updates on rename, attachments, full-text search (`tag:` and `path:`), settings, an LM Studio chat with streaming, inline AI commands with a diff review, projects with their own instructions, an agent that proposes edits, creations, moves and deletes for you to review and apply, and installers for Windows, Linux and macOS.
