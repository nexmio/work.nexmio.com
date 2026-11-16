// Version changes and the tag, so a release is two short commands.
//
//   pnpm release:bump 0.26.0   changes the version in every place and checks the changelog
//   pnpm release:tag           tags the current version and pushes the tag (GitHub builds Preview at once)
//   pnpm release:hotfix 0.25.1 [sha…]  starts a fix for Stable: a branch from the Stable tag (see docs/RELEASING.md)
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

/**
 * The rule for version numbers, so a fix for Stable and the next Preview never want the same one:
 * on `main` every version ends in .0 (0.26.0, 0.27.0); a fix for Stable is made on `hotfix/X.Y.Z`
 * and has a patch number above 0. Other branches have no rule. Returns a message, or null.
 */
export function versionRuleError(branch, version) {
  const patch = Number(version.split(".")[2]);
  if (branch === "main") {
    return patch === 0
      ? null
      : "On main every version ends in .0 (0.26.0, 0.27.0). A patch number is for a fix to Stable, made on a hotfix branch (pnpm release:hotfix).";
  }
  const m = /^hotfix\/(\d+\.\d+\.\d+)$/.exec(branch);
  if (m) {
    if (m[1] !== version) return `On ${branch} the version is ${m[1]}.`;
    return patch > 0 ? null : "A fix for Stable has a patch number above 0 (0.25.1).";
  }
  return null;
}

/** Whether `version` is a valid next fix for the Stable release `base` (`v0.25.0`): same major and minor, higher patch. */
export function hotfixRuleError(base, version) {
  const b = base.replace(/^v/, "").split(".").map(Number);
  const v = version.split(".").map(Number);
  if (b[0] !== v[0] || b[1] !== v[1])
    return `A fix for ${base} keeps the first two numbers: ${b[0]}.${b[1]}.x.`;
  if (!(v[2] > b[2])) return `The fix must have a higher patch number than ${base}.`;
  return null;
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
    const problem = versionRuleError(run("git", ["branch", "--show-current"]), arg);
    if (problem !== null) {
      console.error(problem);
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
    const branch = run("git", ["branch", "--show-current"]);
    if (branch !== "main" && !branch.startsWith("hotfix/")) {
      console.error(
        "A release is tagged on main (a Preview) or on a hotfix branch (a fix for Stable).",
      );
      process.exit(1);
    }
    const problem = versionRuleError(branch, version);
    if (problem !== null) {
      console.error(problem);
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
  } else if (command === "hotfix") {
    const version = arg ?? "";
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      console.error(
        "Use: pnpm release:hotfix 0.25.1 [commit …] (the version of the fix, and optionally fixes to bring along).",
      );
      process.exit(2);
    }
    const base = run("gh", [
      "release",
      "list",
      "--exclude-pre-releases",
      "--limit",
      "1",
      "--json",
      "tagName",
      "--jq",
      ".[0].tagName",
    ]);
    if (base === "") {
      console.error(
        "There is no Stable release yet, so there is nothing to fix there. Fix it on main and make a new Preview.",
      );
      process.exit(1);
    }
    const problem = hotfixRuleError(base, version);
    if (problem !== null) {
      console.error(problem);
      process.exit(1);
    }
    run("git", ["switch", "-c", `hotfix/${version}`, base]);
    for (const commit of process.argv.slice(4))
      execFileSync("git", ["cherry-pick", "-x", commit], { stdio: "inherit" });
    console.log(
      `On the branch hotfix/${version}, made from ${base} (the Stable release). Fix the bug here, add a section "## [${version}]" to CHANGELOG.md, run pnpm release:bump ${version}, commit, then pnpm release:tag.`,
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
      "Use: pnpm release:bump <version>, release:tag, release:hotfix <version> or release:stable [tag]",
    );
    process.exit(2);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
)
  main();
