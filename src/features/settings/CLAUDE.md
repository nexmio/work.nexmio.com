# Settings and help

The Settings window (Appearance, Editor, AI, Tasks and focus, Pages and backup, Shortcuts, About; every change is saved a moment after the last key, with Undo the last change), the settings file (`src-tauri/src/settings/`, `schemaVersion` 1, API keys only in the OS keychain), the how-to guide (`src/features/help/topics/*.md`), About and the bug report links.

- Themes: `settings.theme` is one of eight themes or `system`; the colours are in `src/index.css` (see the UX guide). `ThemePicker` applies a pick at once; it is saved at once too.
- A setting kept per computer (time format, start page) is browser storage wrapped in try/catch; one that belongs to the person on every vault is in the settings file; one that belongs to a vault is in `.vault/config.json`.
- A new feature gets its help text in the topic it belongs to, in the same commit.
- An unknown `schemaVersion` is an error; the file is never overwritten.
