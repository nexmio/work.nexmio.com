# Plans

The area for breaking something big down: a **plan** is an ordinary page (tag `plan`, in the folder `Plans/`) whose nested list is a tree of parts. It is shown as an outline or as a map (the same list), and a part can be tied to an epic, a task and a page.

- The page is the data. `src/lib/planTree.ts` reads and writes only the list; the properties, the heading and every line around the list are kept as they were. A checklist line (`- [ ]`) is a task, not an idea.
- An idea is tied to something by a `[[link]]` in its line: a link to an epic page shows the epic and how far it has come; a link to another page shows the page. A link `[[note#task title]]` ties the idea to a task (any epic). A new task is added to the epic Nexmio Work makes for the plan (`epicFor`, named after the plan) and linked this way; an idea with the same words as a task of that epic shows it too. Every tie can be an existing thing or a new one. "Repeat these steps" makes one task per name in that epic, with the steps as the task's steps. The map is drawn from the top down. Nothing is copied: there is still one epic, one task, one page.
- A plan can live in a project (a folder with its own AI rules, made with the plan or already there). Then `planHome` (in `planStore`) says where its epics (`<project>/Epics`) and pages (`<project>/Notes`) go; other plans use `Tasks/` and the folder of the plan. "Plan from a project" only adds a plan page to the project's folder.
- An archived plan (shown as "Archived") has the tag `plan-finished` as well. Carrying parts over moves them to a new plan and leaves a line "Moved to [[…]]".
- The map (`mapLayout.ts`) is only a view: how each box arranges its parts (one row; a grid of N columns or N rows, one column being a stack) and which were dragged is kept per plan on this computer (`nexmio.planMap`), never in the page. A choice is found by the words of the box and those above it.
- In the app a tree item is called a "part" (not "idea"); the code keeps some old names (`addIdea`, `projectIdeas`).
- No timer, no dates. The name of the area is `PLANS_LABEL` in `planTree.ts`.
- The chosen part is shown in the right panel (the Part tab): the map draws `ChosenPart` into the box `PartSlot` makes there, because the map knows how its boxes are arranged. The map has the whole middle.
- The AI only proposes: "Suggest parts" shows a list to tick, and only the ticked parts are written.
- Every change goes through `usePlanStore.edit`, which reads the page again, changes its list and writes it.
