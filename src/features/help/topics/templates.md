## Meeting notes and quick pages

**New → Quick page** opens the Quick page box. Write a thought, give it a name if you like, and press Save. It goes to **Quick pages** and the page you are working on stays open.

**New → Meeting note…** (also under File) asks for a title, a day and time, who is with you and an agenda, and every question is optional. **Create** saves the page in the meetings folder and leaves you where you are; **Create and start** opens the meeting at once. **Use in this meeting** chooses the parts the meeting has besides its pages: **Agenda**, **Decisions** and **Actions**. They are options and all off until you tick them. Your choice is remembered for the next new meeting on this computer; you can also tick or untick them in the meeting itself (**Use** at the top) and under **Change…** on a meeting. The page is an ordinary Markdown page: the day, the people and the parts are properties at the top, the agenda is a checklist, and there is a section for the pages, the decisions and the actions.

**Start meeting** (a button above any page in the meetings folder, or **Start** on the meeting line at the top of Landing) opens the meeting screen. The notes for the whole meeting are in the middle: you write there all through the meeting, whatever point you are on, and can always read what you wrote. The agenda on the left is a checklist: tick an item, add one, or click an item to mark it **Now** (the pages do not change). **Decisions** are listed under the pages, and **Actions** on the right: an action is a task, written in the page under Actions and listed in Tasks. A part you left out is not shown. Everything is written into the page as you go, and **Esc** leaves the meeting. The box at the bottom right writes down a task, idea or page without changing the meeting's notes.

**After the meeting**, **Prepare next meeting…** (next to **Start meeting**) opens the meeting window filled in: the same title and people, a week later, with the agenda items you did not reach and the same parts. Tasks from the meeting are written in the box on the right: choose the epic of the meeting (made when the first task is saved), another epic, or a new one. No AI is used.

The meeting line at the top of **Landing** shows the next meeting, today or tomorrow, with **Start**. **+2** shows the others. When no meeting is coming, nothing is shown, and all meetings are still in the Meetings folder.

A new vault starts with the folders and templates. In an older vault, use **Settings → Vault → Add standard folders and templates**. Existing templates are never overwritten.

## The Meetings area

**Meetings** in the navigation opens the Meetings area. A page is a meeting when it has the tag **Meeting**, wherever it is. On the left, a calendar with a dot on every day that has a meeting; the calendar is folded to one line (press it to open it), then a search box and the groups **Today**, **Coming** and **Earlier**. Pick a day in the calendar to see only that day. In the middle, the chosen meeting: the parts it has: its agenda (tick an item to write it in the page), the actions (the tasks written in the page), the decisions and the notes of the meeting, in two columns (pages and decisions at the left, agenda and actions at the right), with **Start meeting** and **Open the page**; **···** has **Prepare next…**, **Change when…** and **Delete**. Nothing is stored apart from the pages.

## Daily page

Press **Ctrl/Cmd+Shift+D** for today's page. It is created from your daily template the first time and opened after that.

## How new meeting, quick and daily pages start

Meeting notes, quick pages and daily pages start from the pages **Meeting**, **Quick page** and the daily template in `.vault/templates/`. You can change them there (any Markdown editor works).

| Write this in a template | Nexmio Work fills in        |
| ------------------------ | --------------------------- |
| `{{title}}`              | the name of the page        |
| `{{date}}`               | today's date                |
| `{{time}}`               | the time                    |
| `{{datetime}}`           | date and time               |
| `{{weekday}}`            | the day of the week         |
| `{{date:%d/%m/%Y}}`      | the date in your own format |

Folders and the daily page format are in **Settings → Vault**.
