# Manual test checklist

This is the checklist for everything automated tests cannot cover. Run the whole list on Linux before each release and again on Windows 11 for release candidates. Use a throw-away vault (an empty folder you create for testing) so nothing real is at risk. Items marked **(AI)** need a local AI: the built-in AI, or LM Studio with a model loaded (`http://localhost:1234/v1`).

Keep it up to date: when a feature changes, change its lines here in the same commit.

## Before every release (about 20 checks, 15 minutes)

Run these on the build that is going to be released (the installer or the AppImage from the draft release, not `pnpm tauri dev`). They are what only a person in the real app can check; `pnpm e2e` has already checked the screens in a browser. The full list below is the reference when a part of the app changed.

- [ ] Install the Windows installer (or start the AppImage on Linux): the start screen shows, then the app; the status bar shows the version and `preview`.
- [ ] Open a folder as a vault with the real folder dialog, and close and start Nexmio Work again: the same vault, tabs and page come back.
- [ ] **Try the demo vault** (empty folder): pages, epics with tasks and two meetings are there.
- [ ] Write in a page and watch the status bar: **Saved**. Rename the page and make a link `[[…]]` to it: the link follows.
- [ ] **···** → **Tags…**: add a tag of your own by typing in the box and pressing Enter; tick **Epic**; the chips above the page change. Search shows the tag in **Your tags**.
- [ ] Tasks: add a task in the write-it-down box, tick a step, start a timer on it in the **Timer** tab of the right panel and stop it.
- [ ] Meetings: **New** → pick a time from the list, tick **Agenda** and **Actions**, **Create and start**; type in the pages, add a decision and an action; **Esc** leaves; the meeting page shows what you wrote.
- [ ] Press **Ctrl+S** or wait: History of the page lists the change; restore the earlier version and then undo it.
- [ ] Settings → Vault → Backup: choose a folder, **Back up now**: "Backed up today …".
- [ ] Settings → Appearance → Theme: pick Midnight; it applies at once (no Save); restart: the theme stays.
- [ ] Settings → AI: the engine you chose can **Download** a small model (Windows and Linux installer), then **Load AI**; the status bar chip changes.
- [ ] One AI command with its review: select a sentence with a spelling mistake → **Fix**; the change is shown beside the original; **Accept** writes it, and **Undo last AI change** brings it back.
- [ ] With no AI running, an AI button is greyed out and says why; everything else still works.
- [ ] Help → **What's new** shows the changes of this version; **Help → Check for new version…** opens the releases page in the browser.
- [ ] **File → Export** a page to HTML and open the file; **Import** a small folder of Markdown.
- [ ] Resize the window narrow: the panels fold and nothing runs off the screen.
- [ ] The Microsoft Store package (when there is one, `nexmio-work-msix-test` from the workflow): install it with `Install-TestMsix.ps1`, start it, open a vault; the built-in AI says it is not in the Store version yet, and LM Studio works if it is running.
- [ ] Close Nexmio Work with a page just changed; start it again: the change is there, and History has it.
- [ ] The website (https://work.nexmio.com/) shows the new version in its top line, and the README's pictures load.
- [ ] `PRIVACY.md` and `docs/STORE-LISTING.md` still say what the app does (a cloud AI only after consent, no automatic update check).

## Full list

### 0. Automated checks (do these first)

- [ ] `pnpm check` finishes with no errors (format, lint, typecheck, frontend tests, `cargo fmt`, `cargo clippy`, Rust tests). On Bazzite/Silverblue, run it inside the development container: the host has no GTK/WebKit libraries for the Rust part.
- [ ] `pnpm tauri dev` opens the app window without errors in the terminal.
- [ ] The status bar (bottom right) shows `v<version>+<commit> beta` (`.dirty` at the end means the build has uncommitted changes). The same version is on the welcome screen and in **Settings → About**. Hover over it: the build date and time match the build.

### 1. Start, vaults and the window

- [ ] At start the Nexmio Work picture is shown for about two seconds with the version; a click or any key skips it.
- [ ] First start (no vault): the Welcome screen has **Open folder as vault**, **Create new vault**, the recent list, **How to use Nexmio Work** and **About**, on the Nexmio Work picture.
- [ ] **Create new vault** → pick a parent folder → the window asks for a name and has **Trace my work in today's daily page** (off). A name like `PAM div.` is refused with a red box that says why. Create: the vault opens with `.git`, `.gitignore` (with `.vault/index.db`), `.vault/config.json`, the folders `Meetings` and `Quick notes`, and the templates `Meeting` and `Quick note` in `.vault/templates/`.
- [ ] Tick **Trace my work** when creating a vault: Settings → Tasks and time shows it on.
- [ ] A recent vault whose folder is gone shows **Folder not found** with **Locate** and remove.
- [ ] Close and start again: the last vault opens straight away with its tabs. Start a second copy: the first window comes to the front.
- [ ] Window size and position are remembered.
- [ ] The vault name in the header (or `Ctrl/Cmd+Shift+O`) lists the recent vaults with a check mark on the open one. Switch: the open page is saved and committed first; the other vault's tabs and chats come back. **Open another folder as vault…** and **Create new vault…** work there too.
- [ ] Left edge: Files, Search, Ideas, Tasks and Settings. Pressing the open one hides the panel. Right edge: Outline, Links, History and Images open and close a narrow panel (closed at start); the speech bubble opens the chat.
- [ ] Right-click in an empty area or the status bar: only **Inspect element** (no Reload). In a page and in text boxes the normal menu stays.

### 2. The file panel

- [ ] **New** above the tree: Page, Meeting note…, Quick page, Today's daily page, Folder…, Project… all work, and there is no "From a starter". **File** has Page, Meeting note…, Quick page, Task, Idea, Today's daily page, then **Write it down…**. The `···` menu has no Search or Quick open.
- [ ] **Quick page**: opens the small box on Page; with a name it saves `Quick notes/<name>.md`, without one it uses the first line; the page you are in stays open and unchanged.
- [ ] **Meeting note…**: everything can be left empty. With a day and time, the page is `Meetings/<day> <title>.md` with `meeting:` and `with:` at the top, the agenda as a checklist and a `###` part per item. **Create** keeps you where you are; **Create and start** opens the meeting screen.
- [ ] **Meeting screen**: the first open item is **Now**; typing writes to the page (open it in another tab to see it); **Next item** ticks the item; **+ Add an item** adds it; the write-it-down box does not change the pages; **Esc** leaves. **Start meeting** shows above pages in the Meetings folder.
- [ ] **After the meeting**: next to **Start meeting**, **Prepare next meeting…** fills in the window: same title and people, a week later, only the agenda items that were not ticked.
- [ ] **Where a task goes**: in the write-it-down box (the meeting screen, Ctrl+Shift+N) a task has **Into**. A meeting on its own epic (made when the first task is saved), else the one used last; **+ New epic…** asks for a name; nothing is made without one; no "Inbox" appears.
- [ ] **Pencil and waste bin**: over an epic, a task and a step (list, epic page, task page) the pencil opens a field (Enter saves, Esc and the cross go back, clicking away changes nothing) and the waste bin deletes. Epic and task ask first and say how much goes with them; a step goes at once and **Undo** in the message puts it back at the end. Tab reaches both buttons.
- [ ] **Landing** has one line with the next meeting of today or tomorrow and **Start**; **+N** shows the others; with no meeting today or tomorrow there is no line.
- [ ] Folders first, then pages, A–Z ignoring case; `.md` is hidden. Files and folders starting with `.` never show. Folders show how many pages they hold.
- [ ] Rename (right-click → **Rename**, or F2), drag a page onto a folder, delete (the dialog says it can be restored from history).
- [ ] Create, change and delete a `.md` file in another program: the tree follows within a second or two.
- [ ] **Daily pages** at the top: a calendar with a dot on days with a page; a day opens or makes its page; **Today** works; the Daily folder is not listed in All files.
- [ ] **Recent** lists the pages you opened last (4; Settings → Pages and backup → **Recent pages shown**: 0 hides it, 20 is the most).
- [ ] **Landing** holds Meetings, Quick pages and Tasks. A new page shows **NEW** and a move button until you open it; right-click → **Move to…** moves it.
- [ ] **Projects** are not in All files; each has its own tree, a **+** and a gear. The attachments folder is not in All files.
- [ ] The filter box narrows the tree (also inside projects); Esc clears it. **Collapse all**, **Show the open page** and **Sort** (Name, Last changed, My own order) work.
- [ ] **My own order**: drag to the top or bottom edge of an item places it there; the middle of a folder moves into it. **Move up / Move down** and Alt+Up / Alt+Down work. After a restart the order is kept (`.vault/order.json`).
- [ ] Ctrl/Cmd+click ticks items, Shift+click ticks a range, Esc clears. Right-click: **Move N items to…** (links updated, one question) and **Delete N items** (asks once).
- [ ] Names: a folder or page called `PAM div.`, `nul` or `a:b` is refused with a red box that says why, also when renaming. `v1.2 notes` is fine. A name that already exists in the folder (also with other upper/lower case) is refused while you type. Renaming `plan` to `Plan` works.
- [ ] Drag a page onto a folder that already has a page with that name: a window says what exists where and nothing moves.

### 3. The editor

- [ ] The toolbar: bold, italic, strikethrough, inline code (clicking again removes the marker), headings 1–3, bullet/numbered/task list and quote (switch without stacking), link, link to a page, table, image, code block, horizontal line. Hover shows the name and shortcut. With no page open the buttons are greyed out and the editor is read-only.
- [ ] Live preview: `**bold**`, headings, _italic_, ~~strike~~, `code` and links render with the markers hidden off the cursor line and shown on it. Checkboxes can be clicked. Quotes and code blocks have a background. `---` becomes a line. Front matter shows as a collapsed **Properties** bar.
- [ ] Tables show as a table off the cursor; a cell can be edited, Tab/Shift+Tab/Enter move, Tab in the last cell adds a row, the table toolbar adds and removes rows and columns. `Ctrl/Cmd+Alt+T` inserts one.
- [ ] **</>** (or **Go → Show Markdown source**, `Ctrl/Cmd+Alt+M`) shows the raw text; the choice is remembered.
- [ ] Ctrl/Cmd+B, Ctrl/Cmd+I, Ctrl/Cmd+F work.
- [ ] Save status: **Unsaved changes** → **Saving…** → **Saved** about a second after you stop typing. Restart: the text is still there.
- [ ] A changed file on disk (no unsaved edits): Nexmio Work shows the new text. With unsaved edits: the banner **Keep my version / Load disk version**; History has `Snapshot before reload: …` either way.
- [ ] `Ctrl/Cmd+N`, **New → Page** and right-click a folder → **New page** open the same window that asks for a name (`Untitled`, or `Untitled 1` when that exists). **Create** opens the page with `# <name>` as its first line and the file has that name.
- [ ] Right-click an empty place (for example the status bar): nothing happens. Settings → About → **Debug mode** on: the same click shows **Inspect element**, and so do the menus of the file tree, the plan map and selected text. Off again: they are gone.
- [ ] The **New page** button above the left panel (Pages) opens the name window, in the folder you are in.
- [ ] Pictures on the website (work.nexmio.com): click one; it opens large; Escape, a click outside it or **Close** closes it; Tab to a picture and Enter does the same.
- [ ] Tabs: no duplicate tab; close with ×, middle-click or `Ctrl/Cmd+W`; `Ctrl/Cmd+PageUp/PageDown` switch; `Ctrl/Cmd+\` splits and merges; right-click → **Open in split view**. Two pages with the same name show their folder in the tab. Quit with a split: it comes back.

### 4. Links, tags, pictures and diagrams

- [ ] `[[` opens a list of pages (fuzzy). `[[Note]]`, `[[Note|alias]]`, `[[Note#Heading]]` work; Ctrl/Cmd+click opens; a missing page is muted and a click creates it. Links in code are not links.
- [ ] **Link to a page** (`Ctrl/Cmd+Shift+K`) with a selected word inserts `[[Note|word]]`.
- [ ] Rename a linked page: "Update N links in M pages?"; **Update links** rewrites them in **one** commit `Rename <old> → <new>`.
- [ ] `#tag` is a pill that searches; typing `#` suggests your tags. `tags: [a, b]` counts; `#123` does not.
- [ ] Paste a screenshot, drag a picture, and **Insert image**: the picture is copied into `attachments/` and shown. The size bar (Small / Medium / Large / Original) changes it. A PDF becomes a link that opens in the default app.
- [ ] Move a page with a picture two folders down and back: the picture is still shown.
- [ ] The **Images** tab of the right panel lists every picture, which pages use it and the unused ones; **Insert in page**, the large view and **Move to trash** work.
- [ ] A ```mermaid block with `flowchart LR` becomes a diagram off the cursor; broken code shows a message and the code.

### 5. Version history

Check with `git log --oneline` in the vault folder.

- [ ] `Ctrl/Cmd+S` on a changed page: `Save: <path>`; again without changes: **no** commit.
- [ ] Switching from a changed page: `Autosave: <path>`. Idle time (Settings → Version history, 1 minute to test): `Autosave`. Closing the window: `Autosave on close`, and it closes within 5 seconds.
- [ ] A file changed while Nexmio Work was closed: `Recovered uncommitted changes` on open.
- [ ] **History** (the right panel, `Ctrl/Cmd+Shift+H`): commits for the page with a diff; **Restore this version** adds a snapshot and a `Restore … to …` commit. Renames are followed.
- [ ] Delete a page, **File → Recover deleted pages…**, Restore: it is back.
- [ ] A vault that already is a Git repository keeps its old commits; Nexmio Work only adds.

### 6. Search

- [ ] `Ctrl/Cmd+Shift+F`: results while you type, with word prefixes (`firew` finds firewall) and highlights. `tag:` and `path:` narrow it. Odd input (`"`, `(`, `AND`, `*`) gives no error.
- [ ] `Ctrl/Cmd+P` quick open finds a page by part of its name.
- [ ] `node scripts/gen-vault.mjs ~/nexmio-work-test-1000 1000`, open it: indexing is quick and search answers instantly; typing stays smooth.
- [ ] Delete `.vault/index.db` while Nexmio Work is closed: it is rebuilt.
- [ ] **(AI)** Semantic search (Settings → AI, a local embedding model): **Keyword / Meaning / Both** appear; **Meaning** finds a page by a phrase that is not in it. `.vault/embeddings.db` is ignored by Git.
- [ ] **(AI)** A search like "what is the service desk number?" shows **Answer from my pages**; **Get an answer** answers with the pages it used.

### 7. Tasks and epics

- [ ] `Ctrl/Cmd+Shift+T` or the Tasks icon: one outline of epics, each a box with "N of M" and a bar; the left panel lists the epics. There is no Today, Later, due date or "Moved from earlier" anywhere.
- [ ] Tasks shows one epic at a time. Choose each epic at the left; restart: the last choice is kept. **Loose tasks** has the tasks of pages that are not epics, each with **Make an epic**. Finished epics are under **Finished areas · n**.
- [ ] The **Now** card shows the task that is Doing (else the first open one) with its next step. **Step done** ticks the step (**Task done** when there is none); **I am waiting for someone** moves it under **Waiting for others** and shows it in the right panel; **Choose another** makes another task Doing. The lists **After that**, **Waiting for others** and **Done · n** are right, with no filter buttons and no struck-through text.
- [ ] Press a task's name: the right panel's **Task** tab shows its status, steps and what happened; **Open as full page** opens the task page. **Start timer**, and everything in **More** (New epic, Rename, Open the page, Find tasks in a page, Move this area, Delete) work.
- [ ] Task page, status **Waiting**: **Waiting for (optional)**, type "the customer: reply on the quote" and click away. The file has `status:waiting for:"the customer: reply on the quote"`, the log has "Waiting for: …", and the list shows the text next to **Waiting**. Change the status to Doing: the text and the link are gone from the line.
- [ ] **Waiting for a task…**: type part of another task's title, choose it. The page shows it with its steps; the file has `after:"<note>#<title>"`. Tick that task: this one says **Ready** (page and list). Rename that task: the link still finds it. Open that other task: it says **Waiting for this task** with the task that waits, and the list shows "1 waiting for this". Press the cross: the link is gone.
- [ ] **+ Add a task to …** at the bottom of an open epic: type "Print the guide tomorrow" and press Enter. The title is exactly that (no date is read from it) and the file has `made:<today>` at the end of the line; the list shows the day it was made.
- [ ] **New epic** "Office move": `Tasks/Office move.md` is made and opens. Add three tasks, tick all: the epic moves to **Done**; untick one: it comes back.
- [ ] Select a line in a page → **As a task**: `Tasks/<note>.md` has a `source:` line and the task (with `made:`); the page is unchanged. The epic page shows **Came from**.
- [ ] Task page: two columns. Left: title, **Page**, steps, "What has happened". Right: status (a "Status: …" log line appears), **Made**, **Epic: …**, **Open the page** and the tags. The way back at the top goes to the epic. No due date, time or today's list.
- [ ] Task page **Page**: write two lines and click away: the file has them as plain indented text right under the task. An epic made with **New epic** has a **Page** too (text under its heading).
- [ ] "What has happened": a new line is written as `  - <today> text` (a list item). Hold the mouse over a line: the pencil changes its text and date, the bin deletes it (it asks; History of the page still has it).
- [ ] Old file: a task with `> 2026-10-19 …` log lines and a `> note` line still shows its log and page. Add a log line: that task's lines are now all in the new form; other tasks are untouched. Words like `due:2026-10-23` stay in the file but are not shown.
- [ ] Open the epic's page in another Markdown editor (or GitHub): every log line is on its own line, and the page reads as text under the task.
- [ ] **(AI)** **Break it down** suggests steps; only the ticked ones are added. **Write a status line from the log** uses the written lines, the steps and the page, not the "Status:" lines. **Suggest steps from the page** on an epic adds only the ticked ones.
- [ ] Order: hover an epic, a task and a step and use the arrows; then the same with **Alt+↑/↓** (the focus stays on the item, so it can be pressed again). The page has the new order (a task moves with its steps, page and log). Restart Nexmio Work: the epic order is kept. Change a step's text with the pencil on the task page: Enter saves, Esc goes back; no title or step is a text field before the pencil is pressed. Rename a task: `made:` stays.
- [ ] Delete a task: it asks; History has "Snapshot before delete".

- [ ] **Tasks → Time** has a form to start a timer (no Timer tab until one runs); once started the **Timer** tab appears in the right panel and goes when you stop. Start: write what you are doing, press a tag (the epic with that tag is chosen; with several, choose one) and **Start timer**: a task is made in that epic and the clock runs in the tab and in the status bar. Write in a page meanwhile. **Stop** (with a note): the task's log has one line like `⏱ 1 h 20 min · 09:00–10:20 · note`, the row in the list shows `⏱ …`. Close Nexmio Work with a timer running and open it again: it is still running. **Start timer** on a task, on the task page, at the top of an epic and on the Now task of the list; starting a second timer stops the first and writes its time.
- [ ] **No epic (Loose tasks)** in the Timer tab: write a name, start. The task is in **Loose tasks** in the Tasks panel. Open it (task page or right panel): **Move it into an epic**, choose one, **Move**: the task, its steps and its log are in the epic and gone from Loose tasks, and the timer keeps running.
- [ ] Shut the right panel, click a task in the list (the panel opens), then **Open as full page**: the panel shuts again. With the panel open before, it stays open.
- [ ] **File → Your tags…**: your tags with counts; type a name and **Make** a tag (it shows "not used yet" and is offered when you tag something); **Show** puts `tag:name` in the search and lists pages and the tasks with the tag; **Delete** says how many pages and tasks change, **Delete the tag** takes it off everywhere (a `#tag` in running text stays) and History has a snapshot.
- [ ] **Time** (bottom of the Tasks panel): the total, entries and tasks of the period; **Tag** narrows it (also to the tasks of an epic that has the tag); **This week / This month / Last month / This year / All time**; **By task** opens each entry with hours and note; **By day**; **Copy as CSV** pastes into a spreadsheet.
- [ ] Tags: on a task (right panel and task page) and on an epic (list, epic page) **Add a tag** with suggestions; the task's line has `#tag`, the epic's page has the tag in its properties; a tag of the epic shows dashed on its tasks. At the top of the Tasks panel press a tag: only the epics and tasks that have it are listed; press it again for all.
- [ ] Right-click a folder or a project in Files → **Tags › Add a tag to all pages…**: type a tag; the window says "N pages … · M will change" and the first names; **Add the tag to M pages** writes it in the properties of each page (open one in another editor to see it), a snapshot is in History before and after, and a page added later has no tag. **Remove a tag from all pages…** takes it off the same way. Nexmio Work's own tags are refused.
- [ ] Open a task from the list: the panel's Task tab shows it; **Open as full page**: the panel has no Task tab, the page is only in the middle; **Back** goes to the list (or to the epic, a plan, the start page, a page: wherever it was opened from).

### 8. Ideas and write it down

- [ ] The light bulb: ideas Open / Used / Archived; **New idea**; change the title and page, click away: `Ideas.md` has the page indented under the line (hidden from the tree and not a task).
- [ ] **Make a task**: asks which epic (or a new one), then puts it there with the idea's note as the task's note; the idea is Used. **Make a page**: a page in Quick pages opens. Archive and Bring back work.
- [ ] `Ctrl/Cmd+Shift+N` from inside a page asks first (T, I, N or the buttons) and then shows only that box; each saves and closes with a message that has **Open**; the page you were writing is unchanged. **New → Task**, **New → Idea** and **Quick page** (start page, File, palette) show only that box, with no choice of kind. In a meeting and in the start-page widget: **+ Task**, **+ Idea**, **+ Quick page** open one box, which stays open after saving; the cross closes it.
- [ ] **(AI)** **Think it through** and **Suggest first steps** on an idea: nothing is added until you press the button.

### 9. Daily pages and Trace my work

- [ ] `Ctrl/Cmd+Shift+D` makes `Daily/<today>.md`; again opens the same page. Settings → Vault: daily folder, date format and template are used.
- [ ] Settings → Tasks and time → **Trace my work** on: write in a page, make a task, add a log line, tick it. Today's daily page has "## Worked on" with one line for each; task lines end with `in [[Tasks/…]]`, a link to the epic's page. Write in the same page again: no second line. Remove a line: it stays removed while Nexmio Work runs. Off: nothing is written.

### 10. Setting up the AI

- [ ] **Old settings:** open Nexmio Work with a settings file that has Foundry Local or Phi Silica as the chosen AI: it opens, the AI falls back to the built-in AI, and nothing says the settings could not be read.
- [ ] **Settings → AI**: one built-in engine, **llama.cpp**; none is chosen for a new user.
- [ ] llama.cpp: the hardware found is shown and the engine is pre-selected. There are two engines only, **Graphics card (Vulkan)** and **CPU only** (no CUDA, ROCm, SYCL, and no boxes for processor or graphics card); with a graphics card **Vulkan** is selected, without one **CPU only**. A settings file that says `cuda12` opens and shows Vulkan. Then: a model shows its size and memory; **Download** shows progress, Cancel and continue work; the built-in AI becomes Nexmio Work's provider. **Add my own model file…** copies a `.gguf`.
- [ ] **Settings → AI**: one list "Which AI to use" with three lines: **Built-in AI · llama.cpp** (Beta), **LM Studio, or another AI on this computer**, and **Cloud AI** (last, off). Each line shows its state; the chosen line has its own setup under it. No line for Foundry Local, Phi Silica or Windows AI.
- [ ] **Cloud AI**: add an OpenAI-compatible provider with a cloud address and key; choose Cloud AI: the warning lists what is sent, **Use the cloud AI** is greyed out until "I understand…" is ticked; **Keep the AI on this computer** changes nothing. After using it: the status bar shows **Cloud AI**, the chat page is orange ("your pages go to …"), and a chat answer comes from it. A project with **Local AI only** uses a local AI instead. Choose another AI, then Cloud AI again: the warning comes again.
- [ ] **Load AI** (status bar, and in the settings of the AI) loads the model; **Unload AI** frees the memory (no `llama-server` or helper `nexmio-work` process left). An AI command while the AI is not loaded loads it by itself. Closing or killing Nexmio Work stops the engine. **Sleep after** 1 minute works.
- [ ] A problem (too large a context, missing driver) shows a red box with steps, **Show details** and **Copy details**.
- [ ] **Remove** a model and all files (with a confirmation) cleans the folder shown in the settings.
- [ ] Nothing from the built-in AI is reachable from outside: `curl http://127.0.0.1:<port>/v1/models` without a key is refused.
- [ ] **Settings → AI → LM Studio, or another AI on this computer** → LM Studio: **Load models**, pick one, **Test connection** says connected. An OpenAI-compatible provider with a non-local address shows that it is not used.
- [ ] An API key shows "Key stored" and is **not** in `settings.json` (it is in the system keychain).
- [ ] The status bar AI chip: green when ready, grey when not loaded (with **Load AI**), blue while working (with **Stop**), red with **Fix** on a problem. Clicking it shows the model and where it runs.
- [ ] First run with no model: the welcome appears once; **Skip setup** does not bring it back.

### 11. AI where you work (AI)

- [ ] Select text in a page: the bar has **Fix**, **Rewrite**, **Shorten**, **AI ▾**, **As a task**, **As an idea**. **AI ▾** (and `Ctrl/Cmd+K`) lists the fixed commands; none asks you to type.
- [ ] **Fix** shows a diff with "Same numbers, links and names"; remove a number by hand in a test and see "Check: … is gone". **Accept** (Enter) replaces the text, with `Snapshot before AI: …` and `AI: …` commits; **Try again** and **Reject** (Esc) work.
- [ ] **Explain this** shows an answer with Copy and changes nothing. **Find tasks in it** opens the task finder. Translate to Danish and to English work.
- [ ] **Every text box**: in a task's note box, the log box and a step box, select a word: the same bar appears; a real mouse click on **Fix** shows the review. `Ctrl/Cmd+K` with nothing selected works on the whole text; Accept puts the result in the box. No bar in password, search or name boxes. With no AI the bar says why.
- [ ] A small model that answers with `<think>…</think>` or "Revised text:": only the text is shown. An empty answer, or one that lost most of the text, is not offered: Nexmio Work tries once more and then says it got no usable answer.
- [ ] Settings → AI → **Let the AI check its own answer** is off by default; on, a text command takes longer and a wrong answer is tried again.
- [ ] The **AI** button above a page: fix spelling and grammar (only the wrong words change), improve the structure, a short summary at the top, a title and tags, find tasks, split into pages, an e-mail from this page. **Link related pages** opens the Links panel (no AI).
- [ ] Right-click a folder → **AI**: sort into folders, find duplicates and the other skills that fit a folder. **Make an index page** works without AI. Several ticked pages (up to five) work together.
- [ ] `Ctrl/Cmd+Shift+P`: a skill name runs it on the open page; a page name opens it; actions work.
- [ ] Spelling help (status bar): a misspelt word gets a wavy line; click it for the right spelling, Ignore, Add to my words, Fix all. Nothing changes by itself.

### 12. The chat (AI)

- [ ] `Ctrl/Cmd+L` or the speech bubble opens **Ask about my pages** over the page; Esc closes it and the chat is kept.
- [ ] Ask "Summarize this page": the answer streams and uses the page; untick **Include the open page** and it no longer knows it. **Stop** stops at once.
- [ ] Type `/` or press the paperclip: pages and folders can be attached as chips (× removes one; a sixth is refused). In a project only its pages are offered.
- [ ] The chat answers but never changes a page.
- [ ] Ask "who are you?": Nexmio Work, briefly; in Danish when asked in Danish. Settings → AI has no base instruction any more. **Language of the AI's answers** set to Danish: the chat, the fixed commands and skills answer in Danish; Same as the text: in the language of the text; a Custom command that asks for a translation still translates.
- [ ] **History** reopens earlier chats after a restart; **New chat** starts over; delete one and **Delete all history…** work. `.vault/chats/` is not committed.
- [ ] Stop the AI server and send a message: a clear error, not an endless spinner. A slow model shows a counting timer.

### 13. Reviewing changes (AI)

- [ ] **AI → Split into pages** on a page with several headings: the AI tab shows the steps, then **Review changes**. Nothing is on disk yet.
- [ ] The review lists every file (Edit / Create / Move / Delete, path, reason, diff), with Accept / Reject per file and per group. A change that fails a check is shown unselected with the reason.
- [ ] Reject one file and **Apply selected**: only the accepted files are written; `Snapshot before AI: …` then one `AI: …` commit. **Reject all** writes nothing.
- [ ] Change an affected file on disk before applying: it is marked **Changed since proposal** and must be confirmed.
- [ ] After Apply, **Undo** (or **File → Undo the last AI change**): everything is back, with a "Restore AI changes of …" commit. After a hand edit Undo refuses and says why.
- [ ] A command on more than five pages does three first, then **Looks good, do the other N**.

### 14. Without an AI

- [ ] No provider chosen (or the built-in AI not loaded and not set up): every AI button is greyed out with the reason and **Set up AI**. Pages, search, tasks, ideas, the calendar, outline, links, history, images, import and export all work; the system spellcheck still underlines.

### 15. Projects

- [ ] Settings → AI shows **Main AI** and **Local AI** side by side. With the cloud AI on as the Main AI and an AI on this computer set up: choose it as the Local AI; a project marked **Local AI only** answers with it (the project window says which AI it uses), other pages still use the cloud AI. With no local AI set up the Local AI box says so.
- [ ] **New → Project…**: Name, About this project, AI for this project (Main AI or an AI on this computer) and Local AI only. Save: a new folder in the **vault root** (also with another folder selected), under Projects, with `.vault/projects/<id>.json` committed.
- [ ] A name already used in the root (folder or page, any case) is refused while you type. There is no **Make project** on a folder; a project cannot go inside a folder or another project.
- [ ] Drag pages onto the project: they move in (one `Rename` commit, links updated). Drag one back to All files.
- [ ] **(AI)** A sentence in **About this project** or **About me and my pages** (for example what "Wave 1" means) is known to the chat and to skills, and does not change what Fix, Rewrite or Shorten return. There is no "Ask AI to change the instructions" box.
- [ ] Rename the project folder: the project follows.

### 16. Templates, import, export and index pages

- [ ] There is no **From a template…** or **Save the page as a template…** anywhere (New, File, the start page). A new meeting, quick page and daily page still start from their template in `.vault/templates/` and fill `{{title}}` and `{{date:…}}`.
- [ ] **File → Import pages from a folder…** (see [docs/IMPORT-ONENOTE.md](IMPORT-ONENOTE.md)): the preview counts match, "Left out" lists hidden and unsupported files; import shows progress and a report; pictures are in **Images**, not in the tree; importing again numbers the copies; a folder inside the vault is refused; the source folder is unchanged.
- [ ] **File → Export…** of a page with a heading, a table, a picture, a `[[link]]` and `<script>alert(1)</script>`: HTML shows the picture and the script as text (no dialog); Word has the formatting; PDF opens a preview and prints only the page. A folder exports as one document with a table of contents. Exporting makes no commit.
- [ ] Right-click a folder → **Make an index page**: a list of links; your own text above it is kept when you make it again.

### 17. Settings

- [ ] **File → Settings…** (`Ctrl/Cmd+,`): General, AI (marked Beta), Version history, Vault. The AI tab has the beta page, the list of AIs, then the list of AIs; the chosen row has its own setup under it (no folded sections).
- [ ] **First start** (clear `nexmio.betaNoticeSeen`): "Welcome to Nexmio Work" says it is a first version and that the AI is beta; **Got it** is remembered; **Help → About the AI beta…** shows it again. **Beta** marks sit by the editor AI button, the chat title and the AI tab.
- [ ] **Right-click on selected text**: Cut, Copy, Paste, Select all, then **AI ›**, Add as a task, Add as an idea. Without a selection the system's own menu shows.
- [ ] Appearance → Theme: eight cards (Light, Dark, Slate, Paper, Mint, Midnight, Graphite, Ember); a click changes Nexmio Work at once and is kept. **Follow my computer** follows the computer's Light or Dark; unticking it keeps the theme on screen. Look at the editor, a dialog, the Tasks page and the start page in every theme: text readable, panels, the writing area and raised boxes still apart.
- [ ] General: font size, line width, spellcheck, recent pages, spelling help, Trace my work and your own words take effect.
- [ ] Vault: daily pages folder and template, meetings and quick pages folders, image style; a folder like `../outside` is refused. **Add standard folders and templates** does not overwrite your edits.
- [ ] Edit `settings.json` and set `"schemaVersion": 99`: "Settings could not be loaded" and the file is not overwritten (restore it afterwards).

### 18. Safety

- [ ] A link like `[x](../../outside.txt)` does not open anything outside the vault.
- [ ] Kill the app while it says **Unsaved changes**: at most the last second of typing is lost; the vault opens normally.
- [ ] A symbolic link in the vault that points outside it: the files behind it are not shown or reachable.
- [ ] Network check: while using every AI feature, nothing goes to a host other than the local AI (and, only when you press Download, the download sites).

### 19. Packaging

- [ ] Windows 11: the `…-setup.exe` installs **without** an administrator prompt; Nexmio Work starts from the Start menu with the purple "M" icon; pictures show; **Reveal in file manager** opens Explorer; uninstalling (which also removes `nexmio-work-ai` next to the program) leaves the vaults untouched.
- [ ] Linux: the `.AppImage` starts and Help → Report a bug… opens the browser (or a dialog shows the address). The `.rpm` installs.
- [ ] Microsoft Store package ([docs/MSIX.md](MSIX.md)), in Windows Sandbox or a virtual machine: it installs and starts; a vault opens and saves; Settings and recent vaults are kept after a restart; the built-in AI says it is not available in the Store version yet; uninstalling leaves the pages.
- [ ] The release run has the artifacts `nexmio-work-msix` (unsigned) and `nexmio-work-msix-test`.

### 20. Help, About and reporting

- [ ] The **?** in the top bar, **Help → How to use Nexmio Work** and **F1** open the guide; the search narrows the topics; Esc closes it. A **?** next to a setting explains it and **Read more in the guide** opens the right topic.
- [ ] **Help → About Nexmio Work…** shows the picture, version, build date, the licence (Apache-2.0 with the Commons Clause) and who made it.
- [ ] **Help → Report a bug…**, **Suggest a feature…** and **Report inappropriate AI content…** open GitHub with the form filled in (version and system).

## Epics and other pages with tasks

- [ ] Write `- [ ] test` in an ordinary page: no new epic in the Tasks panel. In **Show all tasks** it is under **Tasks in other pages** (folded).
- [ ] **Make an epic** on it: the page gets `tags: [epic]` (other properties are kept), and it is listed with the epics. Outside `Tasks/` it has no pencil or waste bin.
- [ ] **New epic** makes a page with `tags: [epic]` in its properties. A page in `Tasks/` from before (no tag) is under **Tasks in other pages**; **Make an epic** on each tags it.
- [ ] A meeting note: the agenda lines are not tasks and no epic is made. A task written under `## Notes` in it still shows up.
- [ ] A meeting without an agenda: the text is written under `## Notes`, with no `### Notes` heading.

## Tags on a page

- [ ] The **···** menu above a page: Rename… renames it (links are asked about as in the tree), History opens the history, Export… opens the export. **Tags…**: Meeting and Epic. Tick Epic on an ordinary page: it gets `tags: [epic]` in its properties, a chip shows, and it is listed with your epics. The cross takes it off again.
- [ ] Tick Meeting on any page: **Start meeting** shows. Take it off: it goes, also in the meetings folder.
- [ ] A page with other properties and its own `#tags`: only the `tags:` line changes. A page whose properties only held the tag gets no empty `---` block left behind.

## A page for a task

- [ ] Task page → **Linked page** → **Make a page for this task**: name is the task title, folder is the task note's folder. The page opens with the heading and a line `Task in [[…]]`. The task line gets `[[Name]]` after its title, before `#tags` and `due:`/`made:`.
- [ ] A small chip with the page's name shows in the task list and on the task page; a click opens the page.
- [ ] **Link a page…** picks an existing page. The pencil changes it; the cross unlinks (the page stays).
- [ ] Rename the linked page in the tree: the link in the task line follows. Delete it: the chip is dimmed and says "Page missing"; on the task page **Make the page** makes it again.
- [ ] Rename the task title: the link stays. The link is not in the title anywhere.

## Meetings, Next meeting and Pages page

- [ ] Meetings: Upcoming and Past rows show date and time (`Thu 29 Oct 11:00`); today's rows show the time; a meeting without a time shows the date only. The time follows Settings → Time format.
- [ ] Start page → Next meeting lists today's and tomorrow's meetings to come with Start; none: "No meetings today or tomorrow." "Today's meetings" is not in Add widget.
- [ ] Close every page, then press Files: the Pages page with Recent and All pages shows; typing in Find a page narrows the list; a click opens the page. The house still opens the start page.

## Markdown in text boxes

- [ ] Task page → Page, epic page → Page, idea → Page, the meeting screen's pages, Quick page: type `**bold**` and move to another line: it shows bold; `- one` and Enter continue the list; Tab and Shift+Tab indent; Ctrl+B and Ctrl+I wrap the selection. A page box saves when you click away; Ctrl+Enter saves a quick page, an idea's note and the small page of a new task.
- [ ] Task page → "Write what happened": bold works, Enter adds the line, Shift+Enter writes nothing. Pencil on a log line: the same box; Esc cancels. The log, Focus and the meeting page show bold as bold.
- [ ] Titles, tasks, steps, names, the chat and the AI instructions are still plain one-line or plain text boxes.

## Tab, status, Meetings and the start page

- [ ] In a bullet list, **Tab** moves the item one level in, **Shift+Tab** out; a selection over several items moves them all; a numbered and a task item work too. **Enter** on an empty nested item takes it out one level; on an empty item at the left edge the list ends. A plain line with the caret at its start moves two spaces in and out; with the caret after some text, Tab puts a tab there and Shift+Tab takes it back; in a table cell Tab still moves between cells. The same in the meeting screen, the page box of a task, an epic and an idea, and the write-it-down box (there Tab no longer leaves the box: click away).
- [ ] A task with the status Doing, Waiting or Dropped shows a label at the right end of its row in Tasks and in an epic; a task without a status shows none. The status is still set on the task page.
- [ ] **Meetings** in the navigation opens the meetings. The calendar is folded to one line; press it and it has a dot on the days with a meeting. The search box narrows the list by title and people. Today lists the day's meetings with their time (no daily page); Coming and Earlier follow. A click on a day shows only that day; the cross shows everything again.
- [ ] A click on a meeting shows it in the middle: agenda (ticking an item changes `- [ ]` in the page), tasks from the page, pages under each item. **Start meeting**, **Prepare next…** and **Open the page** work. **+ New** opens the meeting window. A page without the tag Meeting is not listed, also in the meetings folder.
- [ ] The **house** opens the start page; so does closing the last page. **Continue** shows the last page with its first lines and **Open** opens it. Recent has the filters; **Show more** lists up to 20. **···** → **Pin to the start page** puts the page under Pinned (tag `pinned`); the cross on the start page unpins it. A new vault shows three buttons. Narrow the window: one column.
- [ ] **Settings → Appearance → Open the start page when Nexmio Work starts**: on, restart: the start page shows, not the last page. Off (default): the last page opens as before.
- [ ] **Settings → Appearance → Time format**: choose 12-hour: the Meetings list, the meeting page, the Landing line and the start page write `2:30 PM`; the Time field of a new meeting shows `2:30 PM` and accepts `14:30`, `1430` and `2:30 pm`. Choose 24-hour: `14:30`. System follows the computer (24-hour on a Linux with a 24-hour language, AM/PM on a Windows with US settings).
- [ ] A new meeting has today in the Day field; it is listed under Today without picking a day. **Change…** on a meeting changes the day, time and people; the list and the Landing line follow. Clearing the day puts it under No date.
- [ ] A fenced block with no language whose first line is `graph TD` (or `sequenceDiagram`, …) is drawn as a diagram; a ```mermaid block still is; other code is not.
- [ ] The house: the start page fills the window: the left panel (whatever it showed) and the right panel are gone and no area is marked; pressing Pages (or opening a page) brings them back as they were. **Delete** on a meeting asks, then removes the page (find it again in History / Recover deleted pages) and the list updates.
- [ ] Start page → **Customize**: each widget has up/down arrows, Half/Full and a cross; **Add widget** lists the widgets that are not on the page (each can be added once); **Reset** brings back Continue, Recent and Pinned; **Done** leaves. Restart: the layout is the same. Each widget works: Write it down saves a page, task or idea; Search and ask searches (Ask AI is off with a message when no AI is on); Next meeting starts a meeting; Working on opens a task; Areas opens each area; Epic progress opens an epic. A narrow window is one column.
- [ ] AI commands and skills that rewrite text: the answer or the proposed page starts with the text itself, never "Here’s the revised version:", and has no "Let me know…" at the end (try a small model).

## Preview, Stable and the website

- [ ] **Help → Check for new version…** opens the releases page in the browser, and **Help → About Nexmio Work…** has the same link and says which edition this is. The status bar says `preview` after the version. Nothing is sent by Nexmio Work (no network use at start).
- [ ] Preview: after installing a build made from a `-preview` tag the program is called **Nexmio Work Preview**, and it can stand next to an installed Nexmio Work. The first time it starts it has the same settings (vaults, theme) as the Stable one if there was one; changing a setting in Preview does not change Stable.
- [ ] A tag `v0.x.y` makes a pre-release (draft) with the installer, Linux packages and, until v1.0.0, the Store package; a tag such as `v1.1.0-preview.1` makes the "Nexmio Work Preview" build with **no** Store package; neither needs approval. A tag `v1.0.0` waits for approval (GitHub → Actions → the run → **Review deployments**), then makes the release and the Store package. A tag that does not match `package.json` stops at the first step.
- [ ] The website (`https://work.nexmio.com/`) opens in light and dark and on a phone with no sideways scroll; the Preview card links to the releases page and the Stable card says it is not released yet.

## Meeting notes and parts

- [ ] **New → Meeting note…** has **Use in this meeting** with Agenda, Decisions and Actions all unticked the first time (they are options), and no agenda box. Tick Agenda: the agenda box shows. Tick Decisions and Actions too, untick Agenda, press Create: the page has `parts: [decisions, actions]` and no `## Agenda`. The dialog stays open while you tick and untick. The next new meeting starts with the same choice.
- [ ] **Start meeting**: at the top, **Use** has Agenda, Decisions and Actions: ticking one shows it at once (the page gets its section) and unticking hides it. The pages are one box in the middle. Click another agenda item: it is marked **Now** and the pages stay as they were. Tick an item, add an item. Add and remove a decision. Add an action: it appears in the page under `## Actions` as a task with a made date, and in **Tasks** (under Tasks in other pages or the epic you made). Tick it.
- [ ] A meeting without Agenda gives the pages the whole width; without Decisions or Actions those boxes are not shown. **Change…** on a meeting changes the parts; what was written in a part that is off is still in the page.
- [ ] An older meeting (made before this) opens with all three parts, its `### item` pages shown as text in the one pages box, and nothing lost. The Meetings page shows the parts the meeting has.

## Time picker

- [ ] In **New meeting** the Time box has a small arrow. A click on the arrow or in the box opens a list under it, every 15 minutes from 00:00 to 23:45, scrolled to the time in the box (09:00 when it is empty). Click a time: it is written in the box and the list closes. The window stays open.
- [ ] Arrow down opens the list and moves through it; Enter picks the marked time (without one, Enter creates the meeting as before); Esc closes only the list; a click outside closes it. Type `10:20`: it is kept (the nearest quarter is shaded); `1430` and `2:30 pm` still work; `25:00` is marked red and Create is off.
- [ ] With 12-hour time chosen in Settings, the list reads `9:15 AM` and the box `2:30 PM`; the page still stores `14:30`. **Change…** on a meeting has the same box.

## Your own tags

- [ ] **···** → **Tags…** on a page: **Nexmio Work uses these** has Meeting, Epic and Pinned with what each does. Under **Your tags** type `VPN` and press Enter: a chip `#vpn` appears, the page's properties say `tags: [vpn]`, and the box is empty again. Two words, or only digits, are refused with a message. Type `epic`: Nexmio Work's Epic is put on above, with a message.
- [ ] Open Tags… on another page: **Use a tag you already have** lists `#vpn` with a count; a click puts it on. Typing the first letters narrows the list. The cross on a chip takes the tag off.
- [ ] A page with `#idea` in its text shows `In the text: #idea`. Above the page, Meeting or Epic is a filled chip with a mark and says what it does when you point at it; `#vpn` is an outlined chip. Both have a cross.
- [ ] **Search** (nothing typed) lists **Your tags** and **Nexmio Work's tags** with counts; a click writes `tag:vpn` and finds the pages. `tag:meeting` finds the meetings.
- [ ] A page tagged `meeting` and `vpn`: run **Suggest a title and tags**. The proposal keeps `meeting`, adds only tags of its own, and never `epic` or `pinned`.

## Demo vault

- [ ] On the welcome screen, **Try the demo vault** opens the folder dialog; choose an empty folder: a folder `Nexmio Work Demo` is made and opens with pages in Work, two epics in Projects (open **Tasks**: VPN rollout has four tasks, steps and a log) and two meetings in Meetings (one today at 10:00, one tomorrow at 13:30; **Start meeting** works). The start page shows Next meeting.
- [ ] Press **Try the demo vault** again and choose the same folder: the same vault opens, and an edit you made in it is still there. Cancel in the folder dialog does nothing. Delete the `Nexmio Work Demo` folder afterwards: Nexmio Work shows it as "Folder not found" in Recent vaults.

## What's new

- [ ] Remove the stored choice `nexmio.whatsNewSeen` (browser storage), keep `nexmio.betaNoticeSeen`, and restart: a window "What's new in Nexmio Work 0.x" lists three to six lines with a bold lead. **Got it** closes it, and it does not come back at the next start.
- [ ] **Help → What's new** opens it at any time, and **All changes** opens the changelog in the browser. On a computer where Nexmio Work has never run (no stored choices) the window does not come by itself.

## Backup

- [ ] **Settings → Vault → Backup**: choose an empty folder, press **Back up now**: "Backed up today …" shows, and the folder holds `<vault name>.git`. Change a page, back up again: it works. Run `git clone <folder>/<vault name>.git /some/new/place` and open that folder as a vault: the pages and the history are there.
- [ ] Choose a folder that holds another backup (of another vault with the same name) and press **Back up now**: "The backup folder holds another history. Choose an empty folder." and nothing in that folder changed.
- [ ] Tick **Back up when Nexmio Work closes**, change a page and close Nexmio Work: the backup has the change. Disconnect the disk (or rename the folder) and close Nexmio Work: it still closes; start it again and the status bar says "Backup failed" and opens the backup settings when clicked. With a last backup older than seven days the status bar says "Backup is N days old".

### Reading, in short, next step and the taskbar helper

- [ ] **Settings → Editor → Reading**: Line spacing, Letter spacing, Text font and **Follow the line** change the open page and the preview at once and are kept after a restart; **Undo the last change** puts the last one back. With Follow the line on, only the line the cursor is in is clear.
- [ ] A long page → **AI → In short**: points and things to do; the page is unchanged; tick some and **Add N tasks to the epic**; **Copy** copies Markdown; **Try again** asks again. Without an AI the entry is greyed out with the reason.
- [ ] Select a text that describes a flow → **AI ▾ → Draw as a diagram**: a diagram code appears next to the text; **Add under the text** adds a ```mermaid block and the diagram is drawn; the original text is unchanged. Not offered in a one-line field.
- [ ] Stop a timer: nothing is asked. (Where you left off is still written by the taskbar helper.)
- [ ] **Windows:** Settings → Pages and backup → **Taskbar helper**. It is off. Turn it on: a Nexmio Work icon is in the taskbar; under each key it says **Works**. **Ctrl+Alt+N** in another program opens the small window: task (the epic box) or idea, Enter saves, the window closes and the item is in Nexmio Work. **Ctrl+Alt+P**: pick the task (the one in progress is first), write a line, Save: it is in the task's log. Esc closes the window without saving. With no vault open it says to open one.
- [ ] Choose other keys (click the box, press the keys): they work after Save and the old ones do not. Choose keys another program uses: it says **Another program already uses these keys**. The same keys for both: it says they need different keys. **Use Ctrl+Alt+N** puts the standard keys back.
- [ ] **Keep Nexmio Work running** on: closing the window hides it, the icon stays; click the icon or **Open Nexmio Work** to show it; **Quit Nexmio Work** ends it (the pages are saved). Off: closing ends Nexmio Work as before. Turn the helper off and Save: the icon and the keys are gone.
- [ ] **Linux** (and anywhere that is not Windows): the Taskbar helper part of Settings → Pages and backup is greyed out and says it works on Windows only; nothing else changes. Help → The taskbar helper explains it.

### Nexmio Work's own bookkeeping (`.vault/meta.json`)

- [ ] Pin a page (Tags window or its ··· menu): it is on the start page's Pinned, `.vault/meta.json` lists its path and the page's properties have no `pinned`. Rename or move the page in Nexmio Work: it is still pinned. Unpin: gone from the file.
- [ ] Task page → Waiting: type what it waits for, and choose a task: the lines of the task in the page have no `for:` or `after:`; `.vault/meta.json` has them under `tasks`. Status changes show in "What has happened" (in a grey line), and the page's log has no "Status: …" line. Rename the task or the task it waits for in Nexmio Work: the link and the text follow.
- [ ] **Old vault (a page with `tags: [pinned]`, a task line with `for:"…"`):** opening it asks **Move what Nexmio Work keeps to its own file?** with the counts, and says the next version only reads the new place. **Not now**: nothing changes and the pin and the waiting still work. **Move them now**: the tag and the words are gone from the pages, the pins and the waiting still show, History has the pages as they were, and opening the vault again does not ask.
- [ ] Break `.vault/meta.json` (type nonsense in it): Nexmio Work starts, pins show as empty, and pinning something says the file cannot be read and leaves it as it is.
- [ ] The file is in the vault's Git history (File → History of the vault, or `git log -- .vault/meta.json`) after the next autosave.

### Plans

- [ ] The rail has **Plans** right under the house and **Ideas** last; resting the mouse on any icon shows its name. Plans shows a **Beta** mark. With no plan it offers **New plan**.
- [ ] **New plan** → type a name → **Just make the plan** makes the plan and opens it without the steps; **Next: the parts** goes through the three steps.
- [ ] **Map** starts with one box, the plan itself, and the ideas branch out below it, from the top down. Right-click a box: Add a sub-idea (a small window, Enter adds one and stays), Link or make an epic / task / page, Delete and the rest, and **Change the words**; double-click a box changes its words in place.
- [ ] **New plan** asks **Where does it live?**: **In a new project** (on): a folder with the plan's name appears under Projects in Files, with the plan page in it, and the project has the usual project settings. **In a project I have** (a list of projects; off when there is none): the plan page is made in that project's folder. There is no way to make a plan outside a project. A name that is taken by a project gives a message and nothing is made.
- [ ] A plan in the folder Plans (made before plans always lived in a project) has a line above it, "This plan is not in a project yet", and **Move it to a project…** moves the page into the chosen project (links updated). A plan in a project has no such line.
- [ ] In Plans, press **Open the task** (or open a task or an epic from a part): the middle shows the task and the left panel changes from Plans to Tasks, with that task chosen. The same from the start page and from a search result. Press Pages: the left panel shows the files again. A left panel you folded stays folded.
- [ ] Each project in Files has a line under its name: **No plan yet · Make a plan** (opens the plan-from-a-project window for it) or **Open the plan** (opens it in Plans). The line follows when a plan is made or moved.
- [ ] Above an epic and above a task a trail shows the project, the page the epic was made from (for example the plan) and the epic; each step before the last takes you there. An epic in no project, made from nothing, has no trail.
- [ ] The Plans panel lists plans under their project, plans in none under **Not in a project**, and **Projects without a plan** with **Make a plan**, which opens the plan-from-a-project window for that project.
- [ ] In a plan in a project: **Link or make an epic / task** puts epics in `<project>/Epics`, **Link or make a page** puts pages in `<project>/Notes` (folders appear when the first is made). The epic shows in Tasks as usual.
- [ ] **Plan from a project…** (Plans panel, or Plans header with no plan open) and right-click a project in Files → **Make a plan of this project**: choose a project, tick/untick "Start the plan with the pages and epics…", **Make the plan**: `<project>/<project>.md` with the tag `plan`, the pages as ideas linked, folders as branches; nothing else in the project is changed. A project that has a plan says "has a plan" and **Open its plan** opens it. A new project is not a plan until you do this.
- [ ] **+** → Break it down: step 1 a name, next makes `Plans/<name>.md` with `tags: [plan]` and `# <name>`. Step 2: add parts with Enter, **Break it down** on a part adds smaller ones. Step 3 lists the smallest parts; **Make it a task now** adds a task in the epic made for the plan; **Later** closes. Saving and coming back later keeps the plan.
- [ ] Outline, field **+ Add an idea**: type `A`, Enter, Tab, `B`, Enter, Shift+Tab, `C`, Enter: A with B under it, then C beside A (the field is indented while you are a level down). Paste a list with indented lines: it becomes a tree. Nothing gets a chip until you tie it from ···.
- [ ] Outline: fold a branch, click an idea, double-click to change its words, **···** has Break it down, Add a sub-idea, Link or make an epic, Link or make a task, Link or make a page, Repeat, Move up and down, One level in and out, Delete. Open the page in the editor: the list is an ordinary list, and the properties, the heading and any text after the list are as they were.
- [ ] **Link or make an epic…**: pick an epic that is there, or make a new one with the sub-ideas you tick as tasks; the idea shows **Epic · 0 of N** and the chip opens it. **Link or make a task…**: pick an open task, or **Make a new task**: it goes in an epic with the plan's name (made if missing). The idea shows **Task**. **Link or make a page…** (pick, or **Make a new page**) shows **Page · name**.
- [ ] **Suggest parts** (AI) shows a list to tick, nothing is written before; with no AI the button is greyed out with the reason.
- [ ] **Repeat these steps for…** on a branch with sub-ideas: write two names; two new branches with the same steps, and in the plan's epic two tasks (one per name), each with the steps as its steps. No epic per name.
- [ ] **A small place to start** shows the first open task; **Open the task** opens it.
- [ ] **Map** shows the same ideas as boxes; a change there shows in the Outline. The choice of view is kept after a restart.
- [ ] **Finish…**: carrying some ideas over makes a new plan with them; the old plan gets a line "Moved to …", is under **Finished**, and **Open it again** brings it back.

## AI queue, Plans map and small changes (0.25)

- [ ] **(AI)** Select a text in a page, choose **Fix**: the menu closes, a message says it was added, and the AI window's **Tasks** tab shows it. Switch to another page while it works; when it is ready, **Accept** opens the first page and writes the text.
- [ ] **(AI)** Start two commands one after the other: the second waits ("Waiting") until the first is done. **×** on one takes it out.
- [ ] **(AI)** The answer shows only the new text (green); **Show the original** shows red and green. "AI can make mistakes" is on its own line and can be read.
- [ ] **(AI)** **Draw as a diagram**: the answer can be zoomed in and out and made taller.
- [ ] Plans map: right-click a part with parts → **Arrange the parts → In 3 columns**: nine parts stand 3 by 3 with the line from the side; in the right panel, write 4 and press **Rows** (the parts go 4 down); **Parts side by side** goes back. Drag a box: its parts follow. **Tidy up** puts everything back. Drag the empty map to move around; the mouse wheel zooms; the target button puts the map in the middle again. Close and open Nexmio Work: the arrangement is the same.
- [ ] A part with a task and a page shows **Task** and **Page** buttons under its name (outline and map); each opens that.
- [ ] **Archive plan…** puts a plan under **Archived**; **Open it again** brings it back. The start page's **Plans** widget lists plans that are going.
- [ ] Meeting: the small arrow on an agenda point writes it on a new line at the bottom of the pages.
- [ ] Help → **Diagrams (Mermaid)**: copy an example into a page and see it drawn.

## The new layout

- [ ] The navigation has a name beside each icon and a number for Tasks, Meetings and Ideas when something waits. **Collapse** turns it into icons with a dot; it stays that way after a restart. The top button says New page, New task, New plan, New meeting, New idea or New, by the area, and makes that.
- [ ] The field in the middle of the top bar opens quick open (**Ctrl/Cmd+P**); the last row, **Search the text of all pages for …**, opens the search panel with the text. **Ctrl/Cmd+Shift+F** still opens search.
- [ ] The AI status is in the top bar (not the status bar) and works as before.
- [ ] **Ctrl/Cmd+L** opens the **AI** tab beside the page. A question written but not sent is still there after changing tab. The tab has a dot while an answer is written. The queue is called **Queue**.
- [ ] The two buttons at the top right hide the list panel and the right panel; with both hidden and the navigation folded the text has the whole window and stays in the middle.
- [ ] Above a page: the row with its location, the saved words and backlinks, the page menu, the AI button and the Markdown switch; one row of all the formatting buttons; the tags in a line of their own with **+ tag**.
- [ ] The start page opens with **Today**, **Pinned**, **Recent**, **Epic progress** and **Plans** after **Customize → Reset**, in three columns on a wide window.
- [ ] Ideas are cards: write one in the line and press Enter; **To task** and **To page** work and the card moves to Used; **···** has Edit, Archive and Delete; **Open again** brings one back.
- [ ] Plans: choose a box on the map: the **Part** tab of the right panel has Parts, Link to, Arrange the parts, Move, Repeat and Delete, and they work. Drag, zoom, centre and **Tidy up** still work. With no plan open the page offers an empty plan and a plan from a project.
- [ ] Settings has seven sections and no Save; a slider changes the preview while it is dragged and is saved; **Undo the last change** puts it back; closing the window keeps everything.
