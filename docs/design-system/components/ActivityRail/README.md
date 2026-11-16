# ActivityRail

The navigation at the left edge (`src/components/layout/ActivityRail.tsx`) on `sidebar`: a primary New button, then a row with an icon and a name for each area (the open one is `accent` with a `primary` line at its left edge), and Settings and Collapse at the bottom. Folded, it is the 44px icon column (`rail-width`), each icon a 32px button with its name on hover and a dot for what waits.

- Order: Start (the house), Files, Search, Ideas, Tasks, Meetings, then Settings at the bottom.
- Pressing the open panel's icon hides the panel; another icon shows it.
- A new area adds its icon here and follows the area pattern: left panel with a `PanelHeader`, middle page with a `ViewHeader`.
- The right rail mirrors it for the note panels (Outline, Links, History, Images) and the chat.
