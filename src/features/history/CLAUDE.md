# History

Git history of the vault (`src-tauri/src/git/`): automatic commits (save, switching page, idle, close, before and after AI, rename, delete, restore), the history panel with diffs and restore, and recovering deleted pages.

- Never an empty commit; never reset, force, rebase or delete a branch.
- Anything that replaces a page's content is preceded by a snapshot commit or is itself committed.
