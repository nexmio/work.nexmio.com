# Nexmio Work (work.nexmio.com)

Nexmio Work is a desktop app (Tauri 2, Rust backend, React 19 + TypeScript frontend) for plain Markdown pages in ordinary folders, with a local AI, Git history of every change, tasks and epics, ideas, meetings and a start page. It is the **purple** product in the Nexmio family. Version 0.31. The person who owns it does not write code: every change is made by Claude, from a brief, and must be easy to follow and to correct.

## Read first

- `docs/AREAS.md`: the areas of the app and which files belong to each. Every change names its areas.
- The `CLAUDE.md` in an area's main folder: what the area does and its rules.
- `docs/UX-GUIDE.md` and `docs/design-system/`: how every screen looks and works.
- `docs/DECISIONS.md`: the rules that hold now and why, by area (read the sections of your areas). Record every new decision there, in its section, as one line. `docs/history/DECISIONS-2026.md` is the history: search it, do not read it whole.
- `docs/RELEASING.md`: how a release is made (Preview, Stable, a fix for Stable, the Microsoft Store). Read it before any release or tag.
- `project.md` (if present): private handover notes. Never commit it to the public repo.

## Rules

- Everything committed to git is written in English (docs, comments, commit messages).
- The logo is the N mark image plus the text "exmio" and a small "Work" tag in purple. Never bake the product name into an image.
- The website is in English only.
- This project is a standalone public repo. Do not add secrets, and do not refer to private repos or notes in committed files.

## How a change is made

1. **Brief.** The request is a brief (`docs/BRIEF.md`): kind, areas, what, what must not change, done when. Ask for what is missing before planning.
2. **Change plan, then wait.** Before writing code, show the plan: the areas, each file with one line on what changes, what is reused, what is deliberately not touched, the docs that change. Wait for the owner's ok. A UI change also needs a design shown (Artifact type "design") and approved.
3. **Build inside the plan.** Needing a file outside the plan means stopping and saying so first. Work on a branch (`feat/…`, `fix/…`, `chore/…`).
4. **Change report.** After building, run `pnpm areas report main --plan "<the planned areas>"` and show it, with anything outside the plan explained.
5. **Checks and docs.** `pnpm check` (in parts here, see Commands) is green; tests cover new logic; `CHANGELOG.md` under `[Unreleased]`, `docs/MANUAL_TESTS.md`, the in-app help (`src/features/help/topics/`) and `docs/DECISIONS.md` are updated where they are affected.
6. **Commit, merge, release only when asked.**

The skills `/feature` and `/release` in `.claude/skills/` walk through these steps.

## Rules that always hold

- **Never lose user data.** Every write that replaces content is committed before or after; no destructive Git (no reset, force, rebase of published history, moving a published tag). Avoid `rm -rf`.
- **The AI only proposes.** Nothing the AI produces is written without the user accepting it. Pages only go to a local AI unless the user consented to a cloud AI (`ai.cloudConsent`), never in a project marked Local AI only. `ai::router::select_notes` is the only path to a provider.
- **Everything that is not AI works without AI.** An AI button is disabled with the reason (`useAiBlocked`), never a broken screen.
- **Plain files.** A vault stays usable in any Markdown editor. Tags in a page's properties (`epic`, `meeting`) decide what a page is, never the folder. What Nexmio Work keeps about a page or task that is not the page's own text (a pin, what a task waits for, the history of its status) is in `.vault/meta.json`, not in the page.
- **One look everywhere.** Use the shared components (`src/components/`) and tokens; a change to how something looks is made in the shared component, so it changes everywhere unless the brief says otherwise. A new screen follows the UX guide.
- **Areas stay apart.** A feature area uses shared areas, not another feature's inside files; something two features need moves to a shared area.
- **Files never differ only by case** (Windows).
- **No local paths, user names or environment details** in anything published (docs, artifacts, releases, commits).
- **Secrets** (the Store keys) are never pasted, logged or committed; they live only as GitHub secrets.
- **Do not drive the owner's desktop** (mouse, keyboard) and never capture the full desktop; screenshots only of Nexmio Work, headless.
- **English** in the app, the docs and the website (the website has no Danish version). Sentence case in buttons and labels. The owner is answered in Danish.
- **The word is "page", not "note"**, in everything a person reads (labels, messages, help, docs, site, Store text). Kept as "note": a note on a task, an idea or a meeting (the **Notes** section of a meeting), folder names in older vaults, file formats (`## Notes`), SQL names and all code names. A bulk rename of words needs a check of formats and tests: never change a string that is read back from a file.
- **Reading rules** (dyslexia and a short attention): small headings in sentence case, a done item dimmed with its tick and never struck through, an icon always with a word (except a checkbox), one thing to do at a time where the screen can show it (the Now card in Tasks). Settings apply at once, with Undo.
- **Tests are written with the change and are green before it is shown**: the frontend checks, `cargo fmt --check`, `cargo clippy -D warnings` and `cargo test` (in the Rust distrobox). A flaky test is made reliable, not skipped. Look at headless pictures of a changed screen (`pnpm screenshots`, `scripts/e2e/`) before saying it looks right.
- **Commit and push only when the owner asks.** Staging (`git add -A`) after the owner's ok is the checkpoint between phases of a big change. A pushed tag is never moved or deleted. Settings of the GitHub repository (Pages, environments, variables, secrets) are the owner's; say what to change and ask before changing one.
- **Ask only when it is really needed.** Decide with what is written here and in `docs/DECISIONS.md`, work through the whole task, and report what was done, what was left out and why.

## Code

- Rust: `rustfmt`, `clippy -D warnings`, no `unwrap`/`expect`/`panic!` outside tests; Tauri commands are thin and call service modules; paths over IPC are vault-relative with `/` and go through `vault::paths::resolve`; public service functions have `///` docs.
- TypeScript: strict, `typescript-eslint` strictTypeChecked, the React rules, no `any`; every backend call goes through `src/lib/api.ts`; types shared with Rust come from `src/bindings/` (generated by `ts-rs` during `cargo test`, never edited).
- Function components, one per file, tests next to the code (`Foo.tsx` + `Foo.test.tsx`), mocks of `@/lib/api` in tests.
- Conventional Commits; Keep a Changelog; Semantic Versioning. A new dependency is recorded in `docs/DECISIONS.md` with the reason.

## Commands

| What               | Command                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend (Node 22) | `source ~/.nvm/nvm.sh && nvm use 22`, then `pnpm format:check`, `pnpm areas check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`               |
| Rust               | `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test` in `src-tauri/` (here: inside the Rust development distrobox) |
| Everything (CI)    | `pnpm check`                                                                                                                                 |
| Areas of a change  | `pnpm areas report main --plan "Tasks,Shared UI"`                                                                                            |
| Area of a file     | `pnpm areas of src/features/tasks/TaskRow.tsx`                                                                                               |

## Release

On request only. The full guide is `docs/RELEASING.md`; the rules in short:

- **Two lines.** `main` is **Preview**: features and changes, versions that end in `.0` (0.26.0, 0.27.0). **Stable** ("Nexmio Work") is a Preview that the owner has made Stable.
- **Preview:** finish `CHANGELOG.md` (`## [X.Y.Z] - date`), `pnpm release:bump X.Y.Z`, commit and merge to `main`, `pnpm release:tag`. GitHub builds Nexmio Work Preview at once (Windows and Linux installers, and the Store package "Nexmio Work Preview", kept as a download of the run; nothing is sent to the Store for now, the package is uploaded by hand) and publishes a pre-release. Nothing waits in a run.
- **Stable:** only when the owner asks for it by name: `pnpm release:stable vX.Y.Z` (the workflow Release Stable builds the same tag as "Nexmio Work", keeps its Store package as a download of the run and makes it the latest release).
- **A bug in Stable** is never released from `main`. `pnpm release:hotfix X.Y.Z` makes `hotfix/X.Y.Z` from the Stable tag with only the fix (a patch version, its own changelog section); `pnpm release:tag` tags it (no Preview is built, the Store takes no older version); `pnpm release:stable vX.Y.Z` makes it Stable; the same fix is cherry-picked to `main` (`git cherry-pick -x`), and the hotfix branch is never merged.
- **The version** is in `package.json`, `src-tauri/Cargo.toml`, the `nexmio-work` entry of `src-tauri/Cargo.lock`, `docs/MSIX.md` and the line at the top of this file (a test checks they match): change it only with `pnpm release:bump`.
- **Texts are made, not written twice:** "What's new" for GitHub, the in-app list and the Store comes from the changelog bullets (write them for a person); the Store description and search terms come from `docs/STORE-LISTING.md`. The owner never moves files by hand.
- **The Store:** Nexmio Work Preview is private (hidden, found only by its direct link); Nexmio Work is public. Each has its own GitHub environment (`preview`, `stable`) with the variables `MSIX_IDENTITY_NAME`, `MSIX_DISPLAY_NAME` and `STORE_APP_ID`; the shared `MSIX_PUBLISHER` and `MSIX_PUBLISHER_DISPLAY_NAME` are repository variables; the Azure keys are secrets (`docs/MSIX.md`).
- **The website** (`site/`, English only) follows the GitHub releases by itself; nothing on it changes for a release. The custom domain is `work.nexmio.com` (a CNAME record to `nexmio.github.io`, and the domain set under Settings → Pages).
