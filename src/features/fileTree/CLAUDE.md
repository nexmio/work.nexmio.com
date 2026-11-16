# Pages and files

The vault and its pages: the file tree with Recent, Projects, Landing and All files, new page and folder, rename (with link updates), move, delete, vaults and the welcome screen, import, export, daily pages and their calendar, and in Rust `vault/` (paths, file operations, watcher, tree), `markdown/` (properties, tags, links), `links/`, `templates/` (the standard meeting, quick and daily templates), `order/`.

- Every path from the frontend is vault-relative with `/` and goes through `vault::paths::resolve` (no `..`, no `.git`, `.vault` only inside Nexmio Work).
- Delete commits a snapshot first and asks in a `ConfirmDialog` that says it can be restored from history.
- A page's kind comes from the tags in its properties (`epic`, `meeting`, `pinned`; `note_tags.rs`), never from its folder.
- Files never differ only by case.
