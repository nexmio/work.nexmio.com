# Tasks

Tasks are `- [ ]` lines in pages; indented checklist lines are steps, indented text is the task's note, dated lines its log. Words in the line: `status:` (doing, waiting, dropped), `made:` and `#tags` (old `due:`, `plan:` and `est:` words stay in the file and out of the title, but nothing reads them); the first `[[link]]` is the task's note. An epic is a page with the tag `epic`. Frontend: the task list (`TasksView`), the epic and task pages, the timer, Time and Look back, the left panel; `src/stores/taskStore.ts`, `src/lib/taskLogic.ts`. Rust: `src-tauri/src/tasks/`, `commands/tasks.rs`, and Trace my work (`trace.rs`).

- The Tasks area shows one epic at a time (`taskStore.chosenArea`, per vault): the task to do Now (`areaLists`: Doing, else the first open one that is not waiting), After that, Waiting for others and Done (folded). The right panel shows the chosen task (`TaskDetail`).
- There is no planning (no Today, no rescheduling): an outline of epics and steps with a made date.
- A page without the tag `epic` is not an epic; its tasks are under "Loose tasks".
- In a page tagged `meeting` the agenda is not tasks.
- Focus: the timer (on or off, and its length) is a per-computer choice in `uiStore` (`focusTimer`, `focusMinutes`); Ultra focus is local to `FocusMode` and shows one `FocusTask`.
- A log line is one line in the file, so its box is a `singleLine` `MarkdownField` (bold and italic work, a new line cannot be written). A task's note is several lines; a list inside it is written with a `\` before the marker, which Nexmio Work adds and removes itself.
- What a waiting task waits for (`waitingFor`), the task it waits for (`after`, `note path without .md#title`) and the history of its status are kept in `.vault/meta.json` (`src-tauri/src/meta/`), not in the page, and put on the task after it is read. A task is found there by its page and title; Nexmio Work moves the entry when the title or the page's path changes. The old words `for:` and `after:` on a line are still read until they are moved (TEMPORARY, 0.23).
- Changes are made in the page's own line, so the file stays readable in any editor.
- **Look back** (`LookBackPage`, `src/lib/lookBack.ts`, `src/lib/lookBackReport.ts`): a week from Monday, read from the tasks' history, the time lines, the meetings and the page history (`changed_pages`). Ticking a task writes "Done" (unticking "Open again") with the day in its history.
