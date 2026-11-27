1. Press **+ New meeting** in Meetings.
2. Write a title and a time. Tick **Agenda** or **Actions** if you want them.
3. Press **Create and start**, and write notes during the meeting.

![The window for a new meeting](img/new-meeting.png)

For today's page, press **Ctrl/Cmd+Shift+D**.

<!-- more -->

## Meeting notes

**New → Meeting note…** (also under File) asks for a title, a day and time, who is with you and an agenda, and every question is optional. **Create** saves the page in the meetings folder and leaves you where you are; **Create and start** opens the meeting at once. **Project** (when you have projects) gives the meeting a project: it gets the project's tag, shows in the project's Overview, and **Prepare next** keeps it. **Use in this meeting** chooses the parts the meeting has besides its notes: **Agenda**, **Decisions** and **Actions**. They are options and all off until you tick them. Your choice is remembered for the next new meeting on this computer; you can also tick or untick them in the meeting itself (**Use** at the top) and under **Change…** on a meeting. The page is an ordinary Markdown page: the day, the people and the parts are properties at the top, the agenda is a checklist, and there is a section for the notes, the decisions and the actions.

**Start meeting** (a button above any page in the meetings folder, or **Start** on the meeting line at the top of Inbox) opens the meeting screen. The notes for the whole meeting are in the middle: you write there all through the meeting, whatever point you are on, and can always read what you wrote. The agenda on the left is a checklist: tick an item, add one, or click an item to mark it **Now** (the notes do not change). **Decisions** are listed under the notes, and **Actions** on the right: an action is a task, written in the page under Actions and listed in Tasks. A part you left out is not shown. Everything is written into the page as you go, and **Esc** leaves the meeting. The box at the bottom right writes down a task or an idea without changing the meeting's notes.

**After the meeting**, **Prepare next meeting…** (next to **Start meeting**) opens the meeting window filled in: the same title and people, a week later, with the agenda items you did not reach and the same parts. Tasks from the meeting are written in the box on the right: choose the epic of the meeting (made when the first task is saved), another epic, or a new one. No AI is used.

The meeting line at the top of **Inbox** shows the next meeting, today or tomorrow, with **Start**. **+2** shows the others. When no meeting is coming, nothing is shown, and all meetings are still in the Meetings folder.

A new vault starts with the folders and templates. In an older vault, use **Settings → Pages and backup → Add standard folders and templates**. Existing templates are never overwritten.

## The Meetings area

**Meetings** in the navigation opens the Meetings area. A page is a meeting when it has the tag **Meeting**, wherever it is. At the top of the panel at the left is **+ New meeting**. Below it, a calendar with a dot on every day that has a meeting; the calendar is folded to one line (press it to open it), then a search box and the groups **Today**, **Coming** and **Earlier**. Pick a day in the calendar to see only that day. In the middle, the chosen meeting: the parts it has: its agenda (tick an item to write it in the page), the actions (the tasks written in the page), the decisions and the notes of the meeting, in two columns (notes and decisions at the left, agenda and actions at the right), with **Start meeting** and **Open the page**; **···** has **Prepare next…**, **Change when…** and **Delete**. Nothing is stored apart from the pages.

### Decisions, and actions that belong to a project

**Decisions** at the top of the Meetings panel lists every decision written in a meeting, grouped by project and the newest first; choose a project or search, and press one to open its meeting. A meeting that belongs to a project shows **Project · name** at the top, and **Move the actions to the project** moves its actions (with their steps and log) into the epic of the project's plan, so they are in Tasks with the rest of the project. The meeting keeps a line with a link to the epic.

## Daily page

Press **Ctrl/Cmd+Shift+D** for today's page. It is created from your daily template the first time and opened after that.

## How new meeting and daily pages start

Meeting notes and daily pages start from the page **Meeting** and the daily template in `.vault/templates/`. You can change them there (any Markdown editor works).

| Write this in a template | Nexmio Work fills in        |
| ------------------------ | --------------------------- |
| `{{title}}`              | the name of the page        |
| `{{date}}`               | today's date                |
| `{{time}}`               | the time                    |
| `{{datetime}}`           | date and time               |
| `{{weekday}}`            | the day of the week         |
| `{{date:%d/%m/%Y}}`      | the date in your own format |

Folders and the daily page format are in **Settings → Pages and backup**.
