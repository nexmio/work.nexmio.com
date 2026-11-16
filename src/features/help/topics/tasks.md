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
- A task typed in the write-it-down box goes into the epic you choose under **Into**, or a new one (**+ New epic…**). In Focus that is the epic you are working on, in a meeting it is the epic of the meeting, otherwise the one you used last. Nexmio Work never makes an epic by itself.

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

### Focus

Press **Focus** on an epic (in its heading in the list, or at the top of its page). Everything else is hidden. You see the whole epic as one outline: every task is open, and the one you work on is marked **Working on it** (its status becomes Doing), with its page, its steps (the next one marked **Now**) and what has happened. Nothing is locked: fold or unfold any task, press **Work on this** to move the mark, move a task or a step up or down with the arrows that show when the mouse is over it (or Alt+Up and Alt+Down), and add a step under a task without leaving Focus. **Fold the rest** folds every task but the marked one.

The **Timer** box at the top turns the timer on and off; it is remembered, and with the timer off Focus is just the epic and what to do now. The length of the timer is chosen from a short list (15, 25, 45 and 60 minutes) or **Custom…** (1 to 180 minutes); the one you used last is kept. **Ultra focus** shows only the task you are working on, with its steps, its log and a box to write in the log, and the timer if it is on. **Back to the epic** returns to the whole epic.

- **What has happened** under the marked task: write a line and press Enter. It is added to the log with today's date, and you stay in Focus.
- **Done, next step** on the right ticks the Now step. After the last step it asks if the task is done too; then the next open task in the epic is marked. When every task is done, Focus says so and takes you back to the task list.
- The timer (15, 25 or 45 minutes) is for you; nothing happens when it ends except a message.
- **Help me start** is for when you sit and cannot begin. The AI suggests one tiny first step, something under five minutes, for example "open the file and write the heading". It is only added to the task if you press Add it as a step.
- **Something popped into your head?** Use the same box as above: choose Task, Idea or Quick page and write it. A task goes into the epic you choose (the one in Focus at first). You stay in Focus.
- **Esc** or **Leave focus** leaves focus. Nexmio Work then asks **What is the next step?** for the task you worked on (one line, optional). It is written in the task's log as "Left off: …" and shows on the task page and on the start page when you come back. **Do not ask me again** turns the question off; **Settings → Tasks and focus** turns it on again. On Windows the taskbar helper can write the same line from any program (see _The taskbar helper_).

## Tag a page as an epic or a meeting

**···** above a page has **Tags…**, which lists what the page can be: a **Meeting** or an **Epic**. Tick one and it is written in the page's properties (`tags: [epic]`), and the page stays where it is. A page tagged Epic is listed with your epics; a page tagged Meeting gets **Start meeting**. You can write the tag yourself in the properties too.

## A page for a task

A task can point at a page of its own. On the task page, **Linked page** has **Link a page…** (a page you already have) and **Make a page for this task**. The link is written in the task's line as `[[the note]]`, so it works in any Markdown editor. A small chip with the page's name shows in the list; a click opens the page. **Unlink** takes the link off the task and leaves the page alone.
