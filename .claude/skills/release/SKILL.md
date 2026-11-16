---
name: release
description: Commit the finished work and release a new version of Nexmio Work (Windows installer, Microsoft Store package, Linux) through GitHub. Use for /release, or when the owner asks to commit and build a new version or Store package.
---

# Release Nexmio Work

Only when the owner asks. Talk to them in Danish.

1. **Checks green**: `pnpm format:check`, `pnpm areas check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (Node 22) and `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test` in `src-tauri/` (the Rust development distrobox). Stop and report if one fails.
2. **Change report** of everything in the release: `pnpm areas report <last tag>`.
3. **Version** (minor for features, patch for fixes only): `package.json`, `src-tauri/Cargo.toml`, the `nexmio-work` entry in `src-tauri/Cargo.lock`, `docs/MSIX.md`, the version at the top of `CLAUDE.md`. Turn `[Unreleased]` in `CHANGELOG.md` into `## [X.Y.Z] - <date>` with a clean Added / Changed / Fixed / Removed, and an empty `[Unreleased]` above it. Do anything `docs/DECISIONS.md` says must happen "in the release after …".
   **Editions:** every tag `vX.Y.Z` builds **Preview** at once (Store "Nexmio Work Preview", private, and a GitHub pre-release). A Preview is made **Nexmio Work** (Store, latest release) only when the owner asks for it by name: `pnpm release:stable vX.Y.Z` starts the workflow "Release Stable". Do not make a tag for a version the owner has not asked to release. The tag must equal `package.json`; `pnpm release:bump X.Y.Z` changes the version in every place, and `pnpm release:tag` tags and pushes (see `docs/RELEASING.md`).
   **A bug in Stable** is not released from `main`: `pnpm release:hotfix X.Y.Z` makes a branch from the Stable tag with only the fix (patch version, a `## [X.Y.Z]` changelog section), `pnpm release:tag` tags it (no Preview is built), `pnpm release:stable vX.Y.Z` makes it Nexmio Work, and the same fix is cherry-picked to `main` (`docs/RELEASING.md`). Versions on `main` end in .0.
   **Website and README:** change `site/index.html` (new features and screenshots; the download buttons and the version follow the GitHub releases by themselves) and `README.md` so they match the release. `docs/shared-facts.json` lists what both must say in the same words; `src/lib/sharedFacts.test.ts` checks it. New screenshots go in `docs/screenshots/` (also used for the Store): run `pnpm screenshots` when a screen changed, and look at the pictures before committing them.
   **Changelog bullets are shown in the app** ("What's new"): the top-level bullets under Added and Changed, each with a short bold lead and one or two sentences. Write them for the person, not for a developer.
   **Smoke list:** run "Before every release" at the top of `docs/MANUAL_TESTS.md` on the built release before the owner publishes it.
4. **Commit** on the work branch (Conventional Commits, with the attribution lines the session gives), merge `--no-ff` into `main`, then `pnpm release:tag` (tags `vX.Y.Z` and pushes `main` and the tag). Never move or delete a tag that is pushed.
5. **Watch** that the Release workflow started (`gh run list`). Preview publishes itself and nothing waits. Tell the owner (in Danish) that it is out, and that `pnpm release:stable` makes it Nexmio Work when they are ready. Nobody publishes a draft by hand.
6. **What's new** is made from the changelog bullets at every release (`scripts/release/notes.mjs`), so those bullets are the Store text: write them in the owner's words, what they can now do, not how it is built.
