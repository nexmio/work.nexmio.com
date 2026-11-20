# App shell

The window around the areas: `AppShell` (the resizable columns), `ActivityRail` (the navigation: names beside the icons, foldable, with the New button), `RightTabs` (the tabs of the right panel), `Header` (menus, the search field, the AI status), `StatusBar`, `Toasts`, plus `src/App.tsx` (start-up, shortcuts, global dialogs), `src/stores/uiStore.ts` (what is open where; its parts are in `src/stores/ui/`), the tabs and split view (`src/features/workspace/`), quick open and the command palette (`src/features/quickOpen/`).

- `uiStore.centerView` decides what fills the middle; `leftTab`/`rightTab` the side panels. The start page (`"start"`) hides both side panels; asking for a panel leaves it.
- The right panel's tabs are Outline, Links, History and Images where a page is shown; other areas have only their own tab (Task, Part) and the Timer while one runs (`rightTabsFor`). A page tab chosen from another area goes to the page.
- The AI is not a tab: it is a box over the right side (`AiBox`, opened by **AI** in the top bar, `AiBoxButton`, and Ctrl/Cmd+L), over whatever is shown, the start page too. `askOpen` says it is open; opening or closing it changes nothing under it. It stays mounted once shown.
- A new area adds a row to `ActivityRail` and follows the area pattern of the UX guide (list panel with `PanelHeader`, middle page with `ViewHeader`, the chosen thing in the right panel). The New button follows `centerView` (`newAction`).
- The numbers in the navigation come from `src/lib/navCounts.ts` and read only what the stores already hold.
- Shortcuts live in `src/App.tsx` (`useShortcuts`) and are listed in the help topic `shortcuts.md`. The areas are opened through `openNavArea` (`src/lib/actions.ts`): the navigation, the Go menu and Ctrl/Cmd+1 … 6, in one order.
