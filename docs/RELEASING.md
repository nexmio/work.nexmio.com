# Releasing Nexmio Work

Two editions, two workflows, nothing moved by hand, and nothing that waits for you.

| Edition                 | How it starts                                                        | Microsoft Store                | GitHub release             | Website                                |
| ----------------------- | -------------------------------------------------------------------- | ------------------------------ | -------------------------- | -------------------------------------- |
| **Nexmio Work Preview** | you push a tag (`pnpm release:tag`)                                  | "Nexmio Work Preview", private | published as a pre-release | the Preview card                       |
| **Nexmio Work**         | you run **Release Stable** (`pnpm release:stable`) for a Preview tag | "Nexmio Work", public          | becomes the latest release | the main download and the Store button |

Make as many Preview releases as you like. They are how you test on a Windows computer that can only get apps from the Store. When one is good enough, make that tag Stable. Until then only Preview exists.

## A Preview release

1. **Finish the changelog.** Rename `[Unreleased]` to `## [X.Y.Z] - <date>` in `CHANGELOG.md`. The top-level bullets under Added and Changed are the "What's new" in the app, on GitHub and in the Store. Write them for a person, not a developer.
2. **Change the version:** `pnpm release:bump X.Y.Z` (it changes `package.json`, `Cargo.toml`, `Cargo.lock`, `CLAUDE.md` and `docs/MSIX.md`, and stops if the changelog has no section). Commit it on a branch and merge it to `main`.
3. **Tag and push:** `pnpm release:tag`. It stops on uncommitted changes, when you are not on `main`, or when the tag exists.

GitHub builds Preview at once: Windows installer, Linux packages and the Store package "Nexmio Work Preview", which is sent to the Store. The release is published as a pre-release. The run ends; nothing waits.

## Making a Preview Stable

When a version has been in use and is good enough: `pnpm release:stable v0.26.0` (or **GitHub → Actions → Release Stable → Run workflow**, and type the tag). It builds the same tag as "Nexmio Work", sends it to the Store product "Nexmio Work" and makes the release the latest one, which the website's main download follows. Starting it is the decision, so nothing asks again. If you want a second question, add yourself as required reviewer to the environment `stable`.

The workflow stops before building anything if the tag is not `vX.Y.Z` or is not the version in `package.json`.

## What the workflows do

- `release.yml` (a tag): `prepare` checks the tag, makes the texts (`scripts/release/notes.mjs`: the GitHub text, the Store's "What's new" and the Store listing from `docs/STORE-LISTING.md`) and a draft release; `preview` builds (`.github/workflows/build.yml`, edition `preview`) and adds the files; `publish-preview` publishes the pre-release.
- `release-stable.yml` (by hand): the same for edition `stable`, on a tag that already has a Preview release, then `publish-stable`.
- `build.yml`: builds the installers for Windows and Linux (Preview is its own app, "Nexmio Work Preview", so both can be installed), the Store package, and sends it with the texts (`scripts/store/Submit-Store.ps1`). A failure in the Store steps never stops the installers; it shows as a failed step.

## What follows by itself

- **The website** (`site/downloads.js`) asks GitHub for the releases when it is opened: the main download is the newest release that is not a pre-release, the Preview card the newest release with Preview files. Nothing on the site changes for a release. The Store button for Nexmio Work appears when `site/config.js` has its address. Preview is not public in the Store, so the site has no button for it.
- **The app** shows its edition (`NEXMIO_EDITION`, set by the workflow) next to the version. Help → Report a bug… sends the version and the edition.
- **Descriptions, search terms and "What's new" in the Store** come from `docs/STORE-LISTING.md` and `CHANGELOG.md` at every release. Screenshots, the icon, the age rating and the privacy URL are set once in Partner Center.

## One-time set-up

1. **GitHub → Settings → Environments:** `preview` and `stable` (no reviewer needed).
2. **Microsoft Store:** see `docs/MSIX.md`, "Connect the Store". The Store steps skip themselves, with a notice, until the secrets are there, so the first releases work without them.
3. **GitHub → Settings → Pages:** source **GitHub Actions**. The custom domain comes later: move `site/CNAME.later` back to `site/CNAME` when the DNS for `work.nexmio.com` is ready. Until then the site is at `https://nexmio.github.io/work.nexmio.com/`.

## When something goes wrong

- A wrong tag: fix it and make a **new** version. A pushed tag is never moved or deleted.
- A Store certification failure: the Store says why in Partner Center. Fix it and release a new version.
- A Preview that turned out bad: simply make the next Preview. Nothing public has changed.
