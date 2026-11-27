# Releasing Nexmio Work

Two editions, two workflows, nothing moved by hand, and nothing that waits for you.

| Edition                 | How it starts                                                        | Microsoft Store                | GitHub release             | Website                                |
| ----------------------- | -------------------------------------------------------------------- | ------------------------------ | -------------------------- | -------------------------------------- |
| **Nexmio Work Preview** | you push a tag (`pnpm release:tag`)                                  | "Nexmio Work Preview", private | published as a pre-release | the Preview card                       |
| **Nexmio Work**         | you run **Release Stable** (`pnpm release:stable`) for a Preview tag | "Nexmio Work", public          | becomes the latest release | the main download and the Store button |

Make as many Preview releases as you like. They are how you test on a Windows computer that can only get apps from the Store. When one is good enough, make that tag Stable. Until then only Preview exists.

**Pictures of the guide.** If a screen shown in the in-app help changed, run `pnpm help:shots`, look at the pictures and commit them.

## A Preview release

1. **Finish the changelog.** Rename `[Unreleased]` to `## [X.Y.Z] - <date>` in `CHANGELOG.md`. The top-level bullets under Added and Changed are the "What's new" in the app, on GitHub and in the Store. Write them for a person, not a developer.
2. **Change the version:** `pnpm release:bump X.Y.Z` (it changes `package.json`, `Cargo.toml`, `Cargo.lock`, `CLAUDE.md` and `docs/MSIX.md`, and stops if the changelog has no section). Commit it on a branch and merge it to `main`.
3. **Tag and push:** `pnpm release:tag`. It stops on uncommitted changes, when you are not on `main`, or when the tag exists.
4. **The Store changes.** Before the tag, compare `docs/STORE-LISTING.md`, `docs/store/`, `PRIVACY.md` and the MSIX manifest with the last tag, and check that they still say what the app does. Add every field that changed to [STORE-CHANGES.md](STORE-CHANGES.md). After the release, tell the owner which fields in Partner Center to update ("What's new" and the package are always uploaded), or that only those two are needed. Remove an item when the owner says it is entered. The same holds when a Preview is made Stable.

GitHub builds Preview at once: Windows installer, Linux packages and the Store package "Nexmio Work Preview". The Store package is **not** sent to the Store for now: it is kept as a download of the run (**Actions → the run → Artifacts → `nexmio-work-preview-msix`**) and you upload it in Partner Center by hand. The Store texts (description, search terms and "What's new") are in the artifact `release-texts` of the same run. The release is published as a pre-release. The run ends; nothing waits.

## Making a Preview Stable

When a version has been in use and is good enough: `pnpm release:stable v0.26.0` (or **GitHub → Actions → Release Stable → Run workflow**, and type the tag). It builds the same tag as "Nexmio Work", keeps the Store package as a download of the run (`nexmio-work-stable-msix`; not sent to the Store for now) and makes the release the latest one, which the website's main download follows. Starting it is the decision, so nothing asks again. If you want a second question, add yourself as required reviewer to the environment `stable`.

The workflow stops before building anything if the tag is not `vX.Y.Z` or is not the version in `package.json`.

## Fixing a bug in Stable while Preview moves on

Stable and Preview are two lines. `main` is Preview: new features and changes, with versions that end in `.0` (0.26.0, 0.27.0). A fix for Stable is made on its own branch from the Stable tag, so it contains **only the fix** and none of the unfinished features, and has a patch number (0.25.1). The two never want the same number.

1. **Start the fix:** `pnpm release:hotfix 0.25.1`. It makes the branch `hotfix/0.25.1` from the newest Stable tag. (If the fix is already a commit on `main`, add its id: `pnpm release:hotfix 0.25.1 <commit>` brings it along.)
2. **Fix the bug** on that branch. Add `## [0.25.1] - <date>` to `CHANGELOG.md` with one bullet, run `pnpm release:bump 0.25.1`, commit.
3. **Tag and push:** `pnpm release:tag`. Because the tag is not on `main`, Preview is **not** built (Preview is further ahead, and the Store does not take an older version).
4. **Make it Stable:** `pnpm release:stable v0.25.1`. It builds "Nexmio Work 0.25.1", keeps the Store package as a download of the run and makes it the latest release.
5. **Bring the fix to Preview:** make the same fix on `main` (cherry-pick the fix commit: `git cherry-pick -x <commit>`), so the next Preview has it too. Do not merge the hotfix branch into `main`: its version and changelog would clash.

A bug found in **Preview** while you work on a feature is fixed on `main` like any change, and goes out with the next Preview. Only a bug that Stable users have needs the steps above.

## What the workflows do

- `release.yml` (a tag): `prepare` checks the tag and whether it is on `main` (a tag on a hotfix branch builds nothing: it waits for Release Stable), makes the texts (`scripts/release/notes.mjs`: the GitHub text, the Store's "What's new" and the Store listing from `docs/STORE-LISTING.md`) and a draft release; `preview` builds (`.github/workflows/build.yml`, edition `preview`) and adds the files; `publish-preview` publishes the pre-release.
- `release-stable.yml` (by hand): the same for edition `stable`, on a tag that already has a Preview release, then `publish-stable`. It makes the GitHub release itself when a fix for Stable has none.
- `build.yml`: builds the installers for Windows and Linux (Preview is its own app, "Nexmio Work Preview", so both can be installed), the Store package, and keeps it as a download of the run. Nothing is sent to the Store: the step that did it is removed for now (`docs/MSIX.md` says how the Store was connected; the old submit script is in the git history). A failure in the Store steps never stops the installers; it shows as a failed step.

## What follows by itself

- **The website** (`site/downloads.js`) asks GitHub for the releases when it is opened: the main download is the newest release that is not a pre-release, the Preview card the newest release with Preview files. Nothing on the site changes for a release. The Store button for Nexmio Work appears when `site/config.js` has its address. Preview is not public in the Store, so the site has no button for it.
- **The app** shows its edition (`NEXMIO_EDITION`, set by the workflow) next to the version. Help → Report a bug… sends the version and the edition.
- **Descriptions, search terms and "What's new" for the Store** are made from `docs/STORE-LISTING.md` and `CHANGELOG.md` at every release and entered in Partner Center by hand; [STORE-CHANGES.md](STORE-CHANGES.md) says what is waiting. Screenshots, the icon, the age rating and the privacy URL stay in Partner Center until you change them.

## One-time set-up

1. **GitHub → Settings → Environments:** `preview` and `stable` (no reviewer needed).
2. **Microsoft Store:** see `docs/MSIX.md`, "Connect the Store". The Store steps skip themselves, with a notice, until the secrets are there, so the first releases work without them.
3. **GitHub → Settings → Pages:** source **GitHub Actions**. The custom domain is `work.nexmio.com`: a CNAME record `work` pointing to `nexmio.github.io` at the DNS host, and the domain typed under Settings → Pages (then tick Enforce HTTPS). `site/CNAME` documents it; the site is also reachable at `https://nexmio.github.io/work.nexmio.com/` until the domain works. When the domain moves to another DNS host, make the same record there.

## When something goes wrong

- A wrong tag: fix it and make a **new** version. A pushed tag is never moved or deleted.
- A Store certification failure: the Store says why in Partner Center. Fix it and release a new version.
- A Preview that turned out bad: simply make the next Preview. Nothing public has changed.
