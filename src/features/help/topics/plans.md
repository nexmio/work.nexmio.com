## Projects and their plans: break something big down

A big thing is hard to start. Writing it down as parts, and the parts as smaller parts, makes it smaller. A **plan** is where you do that. It is an ordinary page (with the tag `plan`, kept in the folder `Plans`) whose list of parts is a tree, so you can open it in any other editor too. There is no timer and no deadline: a plan goes on for as long as you like.

### Projects

**Projects** in the navigation lists your projects. A project is a folder with its own AI rules and its own tag, and its **plan** is the map of it: the parts it is made of. Each project in the list shows how far its plan has come (tasks done of all); a project without a plan has **Make the plan**. Plans that are in no project yet are listed apart.

A project opens on its **Map**. **Overview** shows the whole project on one page: how far it has come and the task to do **Now**, the time logged on it this month, what waits for others, its meetings (the next one and the last ones) and their decisions, and its newest pages (those in the project's folder or with its tag). Each line opens its thing. Everything is read from where it is kept, so nothing has to be kept up to date by hand.

A meeting belongs to a project when you choose the project in its window (**Project**): it gets the project's tag and shows in the Overview. In the meeting, **Move the actions to the project** puts its tasks into the plan's epic. An idea becomes a part of a plan with **To plan…** on its card.

### Plans and projects

A **project** is a folder with its own AI rules (see Projects). A plan always lives in a project. When you make a plan you choose **In a new project** (a folder with the name of the plan, with the plan in it) or **In a project I have**. The epics and pages you make from the plan are kept inside the project, in the folders `Epics` and `Notes`, so everything about the plan is in one place. A project has a **tag** made from its name when it is made (for example `#server-move`; it is shown in the project's settings and stays the same if you rename the project). The plan page, its epic, and the tasks and pages you make from the plan get that tag, so you can find all of it with the tag (in Search, or with the tag filter in Tasks). What was there before is not changed. A project can have no plan, and you can make one of it when you have been working on it for a while (**Make a plan** under **Projects without a plan**). A plan made before this, in the folder Plans, shows **This plan is not in a project yet** above it; **Move it to a project…** moves the page into one.

A project that is already there can be made a plan: press **Plan from a project…** on the page you see with no plan open, or right-click the project in Files and choose **Make a plan of this project**. Nexmio Work adds a plan page to the project's folder and can start it with the project's pages and epics as parts, linked. Nothing in the project is moved or changed, and a project never becomes a plan unless you ask.

### Make a plan

A new project is made the same way from everywhere: **New project** at the top of the navigation when Projects is open, the arrow ▾ next to the New button (it lists a page, a task, a project, a meeting and an idea, wherever you are), **+ New project** at the bottom of the projects list, **New project…** when you right-click an empty place in the projects list or the Pages panel, **File → New**, and the Pages panel's **···** menu. Press **New project**, or **New** at the top of the plans list. With no plan open, the page offers **Empty plan** and **Plan from a project**. **Break it down** takes you through three short steps, and everything is saved as you go, so you can stop and come back:

1. **What is it?** Write what you want to get done.
2. **What are the parts?** Write the parts as they come, and press **Break it down** on a part to write smaller ones under it. **Suggest parts** lets the AI propose parts; you tick the ones you want.
3. **Where to start.** Choose the one smallest thing to begin with, and make it a task now, or leave it for later.

### The outline and the map

A plan opens on the **Map**; if you choose **Outline**, it opens there until you choose the map again. **Map** shows the plan as a box at the top, and the parts below it as boxes with lines. Choose a box and its actions are in the **Part** tab of the right panel (grouped as Note, Parts, Link to (a task or a page), Arrange the parts and Move, with Repeat and Delete at the bottom), or right-click it for the same menu. **Rename** in the panel (or in the right-click menu) changes the words right there; double-clicking the box changes them on the map. **Write a note…** in the right-click menu opens the note in the panel, ready to write. Under **Move**: **Earlier** and **Later** change the order of the parts next to it (left to right on the map, or top to bottom in a stack), **Under the one before** makes it a smaller part of the part just before it, and **One level up** takes it out of the part it is in. A move that cannot be made there is greyed out. **Outline** shows the parts as an indented list you can fold. Click a part to choose it, double-click to rename it, and press **···** for more. They are the same list: a change in one shows in the other. Under the outline, **A small place to start** points at the first open task.

### Write it all down first

In the outline, the field **+ Add a part** takes parts one after the other: **Enter** adds one and stays, **Tab** makes the next one a smaller part of the one you just wrote, and **Shift+Tab** goes back up a level. You can also paste a list (one part on each line, indented for smaller parts) and it becomes a tree at once. Nothing has to be tied to anything yet: come back later and tie only the parts you want to.

### Tie a part to the rest of Nexmio Work

Press **···** on a part:

- **Break it down…** asks the AI for parts of the part. The AI reads the whole plan (every part, and the notes on them), the plan's page, the pages linked to the part and the tasks of the plan, so it suggests only what belongs to this part and leaves out what is already in the plan or belongs under another part. It runs in the AI queue: you can go on working, and you tick which parts to add in the queue.
- **Add a part** writes smaller parts under it: write one and press **Enter** or **Add**, and the field stays for the next. **Close** when you are done.
- **Write a note…** keeps a few words about what the part is for, without making a page for it. On the map it is the **Note** group in the right panel, and the box shows **Note**.
- **Link or make a task…** links a task that is already there, or makes a new one in the epic of the plan (an epic with the plan's name, made if it is not there). The part shows **Task**.
- **Link or make a page…** links a page, or makes a new one with a link back to the plan (**Make a new page…**). A new page is offered a folder for each part, for example `Notes/Network/Switches`, and you can choose another under **Save it in**. The part shows **Page · name**.
- **Repeat these steps for…** is for things you do the same way more than once, such as asking several suppliers the same questions. Write the steps as parts of a part ("Ask a supplier" with "Get a price" and "Ask about delivery" under it), then give the names. The window draws what will happen, with your words: the part stays as the heading, each name becomes a part under it with the steps, and each name gets a task in the epic of the plan with the steps as its steps. The steps move into the names, so they are not there twice; if one of the steps is tied to a page, a task or an epic, the steps stay and the names come after them.

Nothing is copied: there is still one epic, one task and one page, and the plan only points at them.

### Archive a plan, or carry on

**Archive plan…** puts the plan away when it is all done, or carries the open parts over to a new plan (the old one keeps a line, “Moved to …”). An archived plan is listed under **Archived**, stays readable, and **Open it again** brings it back. **Delete plan…** (in the **···** menu of an archived plan) deletes the plan's page. The window also lists the plan's epic and the pages linked from it: only what you tick is deleted too. All of it is saved first, so **Recover deleted** in History brings it back.

### In the file

A plan is a page like any other: the properties (`tags: [plan]`), a heading, a few lines if you like, and the parts as a list (`- part`, indented for a smaller part, with `[[links]]`). The note of a part is a line under it, indented and starting with `>` (`  > Only the physical servers`). Nexmio Work only changes the list, and keeps everything else in the page as it was. A line that starts with `- [ ]` is a task, not a part.

### Arrange the map

A big map can get wide. Right-click a part that has parts under it and choose **Arrange the parts**: **side by side** (one row), **stacked** (under each other, with the line coming in from the side), or in 2 or 3 columns or rows. For any other number, choose the part and use the grid box in the panel on the right: write a number and press **Columns** or **Rows** (nine parts, 3 columns, is a 3 by 3 grid; by columns the order runs along each row, by rows it runs down each column). You can also drag a box to move it (the parts under it follow), drag the empty map to move around, and zoom with the mouse wheel (or the buttons), and press **Tidy up** to put every box back where the map places it. The arrangement is kept for each plan on this computer, also when you rename a part or tie it to a page or a task; the plan itself is not changed. A part that is tied to a task, a page or an epic shows small buttons for them under its name.
