// Version changes and the tag, so a release is two short commands.
//
//   pnpm release:bump 0.26.0   changes the version in every place and checks the changelog
//   pnpm release:tag           tags the current version and pushes the tag (GitHub builds Preview at once)
//   pnpm release:stable [tag]  makes a Preview release that is out into Nexmio Work (builds Stable, sends it
//                              to the Store, makes it the latest release); the tag is the current version
//
// The text changes are tested in bump.test.mjs.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** The version in `package.json` text. */
export function bumpPackage(text, version) {
  return text.replace(/("version":\s*")[^"]+(")/, `$1${version}$2`);
}

/** The package version in `Cargo.toml` (the first `version = "…"`). */
export function bumpCargoToml(text, version) {
  return text.replace(/^version = "[^"]+"/m, `version = "${version}"`);
}

/** The `nexmio-work` entry in `Cargo.lock`. */
export function bumpCargoLock(text, version) {
  return text.replace(/(name = "nexmio-work"\nversion = ")[^"]+(")/, `$1${version}$2`);
}

/** The version in the first line of `CLAUDE.md` ("Version 0.25.") and in the MSIX guide's examples. */
export function bumpDocs(text, version) {
  const minor = version.split(".").slice(0, 2).join(".");
  return text
    .replace(/Version \d+\.\d+\./, `Version ${minor}.`)
    .replace(/-Version \d+\.\d+\.\d+/g, `-Version ${version}`)
    .replace(/NexmioWork_\d+\.\d+\.\d+\.0_x64/g, `NexmioWork_${version}.0_x64`);
}

/** Whether `CHANGELOG.md` has a section for the version. */
export function hasChangelog(text, version) {
  return text.includes(`## [${version}]`);
}

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

function edit(file, fn) {
  const before = fs.readFileSync(file, "utf8");
  const after = fn(before);
  if (after !== before) fs.writeFileSync(file, after);
}

function main() {
  const [command, arg] = process.argv.slice(2);
  if (command === "bump") {
    if (!/^\d+\.\d+\.\d+$/.test(arg ?? "")) {
      console.error("Use: pnpm release:bump 0.26.0 (three numbers).");
      process.exit(2);
    }
    if (!hasChangelog(fs.readFileSync("CHANGELOG.md", "utf8"), arg)) {
      console.error(
        `CHANGELOG.md needs a section "## [${arg}] - <date>" first (rename [Unreleased]).`,
      );
      process.exit(1);
    }
    edit("package.json", (t) => bumpPackage(t, arg));
    edit("src-tauri/Cargo.toml", (t) => bumpCargoToml(t, arg));
    edit("src-tauri/Cargo.lock", (t) => bumpCargoLock(t, arg));
    edit("CLAUDE.md", (t) => bumpDocs(t, arg));
    edit("docs/MSIX.md", (t) => bumpDocs(t, arg));
    console.log(`The version is ${arg} everywhere. Commit it, then run: pnpm release:tag`);
  } else if (command === "tag") {
    const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
    const tag = `v${version}`;
    if (run("git", ["status", "--porcelain"]) !== "") {
      console.error("There are changes that are not committed. Commit them first.");
      process.exit(1);
    }
    if (run("git", ["branch", "--show-current"]) !== "main") {
      console.error("A release is tagged on main. Merge to main first.");
      process.exit(1);
    }
    if (run("git", ["tag", "--list", tag]) !== "") {
      console.error(
        `The tag ${tag} exists already. A pushed tag is never moved: use a new version.`,
      );
      process.exit(1);
    }
    run("git", ["tag", tag]);
    execFileSync("git", ["push", "origin", "main", tag], { stdio: "inherit" });
    console.log(
      `Pushed ${tag}. GitHub builds Preview now. When a Preview is good enough: pnpm release:stable.`,
    );
  } else if (command === "stable") {
    const tag = arg ?? `v${JSON.parse(fs.readFileSync("package.json", "utf8")).version}`;
    if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
      console.error("Use: pnpm release:stable v0.26.0");
      process.exit(2);
    }
    execFileSync("gh", ["workflow", "run", "release-stable.yml", "-f", `tag=${tag}`], {
      stdio: "inherit",
    });
    console.log(`Started Release Stable for ${tag}. Follow it under Actions on GitHub.`);
  } else {
    console.error(
      "Use: pnpm release:bump <version>, pnpm release:tag or pnpm release:stable [tag]",
    );
    process.exit(2);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
)
  main();
