## Tasks and epics

A task in Nexmio Work is an ordinary line in an ordinary page: `- [ ] Renew the licence`. Nexmio Work reads these lines in **every** page, but only a page with the tag `epic` is an epic (**New epic** adds it for you). Loose tasks wait under **Loose tasks** (press **Make an epic** to list one), so a checklist in an ordinary page does not become an epic by accident. The agenda of a meeting note is not tasks. Press **Tasks** in the navigation at the left, or **Ctrl/Cmd+Shift+T**. The pages stay yours: without Nexmio Work the lines are still a checklist in any Markdown editor.

### Epics

An **epic** is a page with tasks in it. The Tasks area shows **one epic at a time**, so a short list is easier to keep in focus. Choose the epic under **Choose one area** at the left (Nexmio Work remembers your choice); the others are put away, not gone. In the middle, the task to do **Now** is on top with its next step and three choices: **Step done**, **I am waiting for someone** and **Choose another**. Under **After that** are the other open tasks, under **Waiting for others** the tasks that wait (with what they wait for), and the done tasks are folded under **Done**. A task with steps has a small arrow: unfold it to tick its steps, or add one, right in the list. **+ Add a task to …** at the bottom adds a task to the epic. Press a task's name to see its steps and what has happened in the right panel (**Open as full page** opens the whole task page). **Start focus** starts Focus on the epic; **More** has New epic, Rename, Open the page, Find tasks in a page, Move this area up or down and Delete. A finished epic is under **Finished areas** at the left.

**Put things in your own order.** Hold the mouse over an epic, a task or a step: the small arrows move it one place up or down (or press **Alt+↑** / **Alt+↓** on it). A task moves with its steps, page and log, and keeps its place in the page, so the file has the same order. The order of the epics is kept in the vault.

**Change a name or delete.** Titles are text, not fields, so nothing changes by a slip. Hold the mouse over an epic, a task or a step: the **pencil** opens a field (Enter saves, Esc goes back), the **waste bin** deletes. An epic or a task asks first and says how much goes with it; a step goes at once, and **Undo** in the message puts it back at the end. Everything stays in the version history of the page.

There are no due dates, no Today and no Later: a task is there to keep track of the work and its steps. Each task shows the day it was made.

- **New epic** asks for a name and makes a page in the folder **Tasks** (shown in Landing). The tasks are written in that page, so it also works in any other editor.
- A task you make from a page elsewhere (**As a task** over selected text, or **Find tasks in a page**) goes into an epic of its own for that page: a page in **Tasks** with a `source:` line that points back. The page you were in is not changed. A page where you typed `- [ ]` yourself is an epic too.
- Open an epic to add tasks, **Go to the epic's page**, go to the page it **Came from**, or **Suggest steps from the page**: the AI reads the page (and the page it came from) and suggests the next tasks, and only the ones you choose are added.
- Delete the page and the epic and its tasks disappear from the lists (History still has the page).
- A task typed in the write-it-down box goes into the epic you choose under **Into**, or a new one (**+ New epic…**). In a meeting it is the epic of the meeting, otherwise the one you used last. Nexmio Work never makes an epic by itself.

### One task

A task with a status shows it as a small label at the right end of its row in the lists (Doing, Waiting or Dropped); a task without one shows nothing. Press a task to open it. On the left is what you write (the page, the steps and what has happened); the card on the right has the **status** (To do, Doing, Waiting), the day it was **made**, and buttons to its epic and its page. When the status is **Waiting**, the card also asks who or what the task **waits for** (a few words, shown in the lists), and lets you pick a **task** it waits for: it says **Ready** when that task is done. The way back at the top goes to its epic.

- **Page** is a few lines about the task that are not part of the log: what it is about, who to ask. It is saved when you leave the box. An epic has a page too.
- **Steps** are small tasks under the task. The next step is marked. Click a step's text to change it (Enter saves, Esc puts it back), and use the arrows to move it. Press **Break it down** and the AI suggests steps; you choose which ones stay, and nothing is written until you press Add. It needs a local AI that is running.
- **What has happened** is a log. Write a line and it gets today's date. A change of status is written there too. It reads as a timeline. Hold the mouse over a line: the **pencil** changes its text and date, the **bin** deletes it (History of the page still has it). **Write a status line from the log** asks the AI for one line about where the task stands, from the log, the steps and the page.
- Click the **title** to rename the task. **Show Markdown** shows its lines as written. In the card, **Epic: …** opens its epic and **Open the page** opens the page the task is written in.

### How it looks in the file

```
- [ ] Renew the Acme licence #acme status:waiting made:2026-10-12
  Only for the Acme office.
  - [x] Send the price list
  - [ ] Ask Peter about a discount
  - 2026-10-14 Mette wants 40 users.
  - 2026-10-16 Waiting for Peter.
```

Under a task, indented: plain text is its **page**, checklist lines are its **steps**, and list items that start with a date are **what has happened**. Each is on its own line in any Markdown editor. `status:` is a plain word you can type yourself; what a waiting task waits for, and the task it waits for, are not in the page: Nexmio Work keeps them in its own file, `.vault/meta.json`, so the line stays clean; `made:` is written by Nexmio Work when it makes a task (a task you write by hand simply has no date). Older files with `>` lines for the page and the log, or words like `due:`, still work: Nexmio Work reads them and leaves them as they are. If you change a task in the page while the list is open, press the Tasks icon again to read the list again.

### Find tasks in a page

Open a page and press **Find tasks in a page** in the task list (or use the command palette). The local AI reads the page and suggests tasks. You choose which ones to keep, and only those are added to the epic of that page. Tasks it already has are not added twice.

### Ideas

**Ideas** is its own area: press **Ideas** in the navigation. The ideas are cards in three columns, **Open**, **Used** and **Archived**. Write an idea in the line at the top and press Enter, or press **Ctrl/Cmd+Shift+N** from anywhere. A card shows the whole idea and its page; **To task** and **To page** turn it into something (it stays under Used, so nothing is lost), **···** has Edit, Archive and Delete, and pressing the idea opens it to read and change with a small page. The list panel at the left is hidden here; the panel button in the top bar shows it. An idea is a dated line in the page `Ideas` in the vault root (hidden from the file tree), for example `- 2026-10-19 Use Nexmio Work for the weekly status #work`, with its page indented under it.

- **Make a task** asks which epic it goes into, and puts the idea there, with the idea's note as the task's note. **Make a page** makes a page in Quick pages with the idea's note in it, and opens it. The idea stays under _Used_, so nothing is lost.
- **Archive** takes an idea out of the way; **Bring back** makes it open again.
- Select text in a page and choose **As a task** or **As an idea** in the bar that appears, to write it down without leaving the page.

### Write it down from anywhere

Each kind has its own box. **New → Quick page**, **New → Task** and **New → Idea** (on the start page, in **File**, and in the command palette) open only that box: **Quick page**, **New task** or **New idea**. A task goes into the epic you choose under **Into**; a quick page gets a title and goes to the Quick pages folder. **Ctrl/Cmd+Shift+N** (**File → Write it down…**) asks first: press **T**, **I** or **N**. In a meeting, in Focus and on the start page there are three buttons, **+ Task**, **+ Idea** and **+ Quick page**; the box stays open after saving, so you can write the next one. The page you are writing is not changed.

### Timer

Start a timer under **Tasks → Time**. While it runs, the **Timer** tab appears in the right panel and keeps going beside the page you are writing, so you can write a page while it runs. To start one:

- **On a new task:** write what you are doing, choose the epic it belongs to (or press a tag, and the epic that has that tag is chosen), and press **Start timer**. The task is made in that epic and the timer starts on it. With **No epic (Loose tasks)** it goes into the page **Loose tasks**; open it later and press **Move** to put it into an epic.
- **On a task you have:** press **Start timer** on the task in the right panel, on its page, in the heading of the list (the task to do Now) or at the top of an epic, or press **Start** in the list under **Or start on a task you have**.

A running timer shows its clock in the Timer tab and in the status bar at the bottom. Only one timer runs at a time: starting another one stops the first and writes its time. Press **Stop**, and one line is added to the task's log, for example `⏱ 1 h 20 min · 09:00–10:20 · what you did` (you can write a note for the line before you stop). It is ordinary text in the page, so any editor reads it. The start of a running timer is kept on this computer, so it survives closing Nexmio Work.

### Time

**Time** at the bottom of the Tasks panel shows what each task took, from the time lines in the logs. Choose a **tag** (a task counts for the tags of its epic too) and a **period** (this week, this month, last month, this year or all time), and see the total, the number of entries and the tasks, **By task** (open one to see each entry with its hours and note) or **By day**. **Copy as CSV** copies the entries for a spreadsheet or an invoice. A task that has had a timer shows its total on its row in the list, for example `⏱ 6 h 10 min`.

### Tags on tasks and epics

A task or an epic can have tags, the same tags as on pages, for example a customer. In the right panel, on the task page and at the top of an epic, **Add a tag** (the tags you already use are offered as you type) and the cross takes one off. A tag on a task is written as `#tag` in its line; a tag on an epic is written in its page's properties, and it counts for all the tasks in the epic (shown dashed on the task). At the top of the Tasks panel the tags in use are listed: press one to see only the epics and tasks that have it, and press it again to see everything. Search finds them with `tag:name`.

## Tag a page as an epic or a meeting

**···** above a page has **Tags…**, which lists what the page can be: a **Meeting** or an **Epic**. Tick one and it is written in the page's properties (`tags: [epic]`), and the page stays where it is. A page tagged Epic is listed with your epics; a page tagged Meeting gets **Start meeting**. You can write the tag yourself in the properties too.

## A page for a task

A task can point at a page of its own. On the task page, **Linked page** has **Link a page…** (a page you already have) and **Make a page for this task**. The link is written in the task's line as `[[the note]]`, so it works in any Markdown editor. A small chip with the page's name shows in the list; a click opens the page. **Unlink** takes the link off the task and leaves the page alone.
