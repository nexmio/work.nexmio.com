# Nexmio Work (work.nexmio.com)

Nexmio Work is a desktop app (Tauri 2, Rust backend, React 19 + TypeScript frontend) for plain Markdown pages in ordinary folders, with a local AI, Git history of every change, tasks and epics, ideas, meetings and a start page. It is the **purple** product in the Nexmio family. Version 0.25. The person who owns it does not write code: every change is made by Claude, from a brief, and must be easy to follow and to correct.

## Read first

- `docs/AREAS.md`: the areas of the app and which files belong to each. Every change names its areas.
- The `CLAUDE.md` in an area's main folder: what the area does and its rules.
- `docs/UX-GUIDE.md` and `docs/design-system/`: how every screen looks and works.
- `docs/DECISIONS.md`: why things are as they are (newest at the bottom). Record every new decision there.
- `brand/LAYOUT.md`: the layout every Nexmio site and app follows.
- `brand/preview/site/work.html`: a working reference page for this product.
- `project.md` (if present): private handover pages from the Nexmio control repo. Never commit it to the public repo.

## Rules

- `brand/` is a generated copy of the shared brand kit. **Do not edit files in `brand/`.** Changes to the brand are made in the Nexmio control repo and exported again.
- Everything committed to git is written in English (docs, comments, commit messages).
- The logo is the N mark image plus the text "exmio" and a small "Work" tag in purple. Never bake the product name into an image.
- The website is in English only.
- This project is a standalone public repo. Do not add secrets, and do not reference the private control repo in committed files.

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
- **Secrets** (the Phi Silica token) are never pasted, logged or committed; they live only as GitHub secrets.
- **Do not drive the owner's desktop** (mouse, keyboard) and never capture the full desktop; screenshots only of Nexmio Work, headless.
- **English** in the app and the docs, sentence case in buttons and labels. The owner is answered in Danish.

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

On request only. Every tag builds **Nexmio Work Preview** at once (installers and the Microsoft Store package, private in the Store) and publishes a pre-release. A Preview that is good enough is made **Nexmio Work** with `pnpm release:stable` (the workflow "Release Stable": builds, sends to the Store, makes the release the latest). Nothing waits in a run. Steps (`docs/RELEASING.md`): finish `CHANGELOG.md` (`## [X.Y.Z] - date`), `pnpm release:bump X.Y.Z`, commit and merge to `main`, `pnpm release:tag`. The version is in `package.json`, `src-tauri/Cargo.toml`, the `nexmio-work` entry of `src-tauri/Cargo.lock`, `docs/MSIX.md` and the line at the top of this file (a test checks they match). The "What's new" for GitHub and the Store is made from the changelog; the owner never moves files by hand.
