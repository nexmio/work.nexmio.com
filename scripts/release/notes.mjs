// Release texts, made from the files in the repository so nobody writes them twice.
//
//   node scripts/release/notes.mjs <version> <out-dir>
//
// writes in <out-dir>:
//   release-notes.md  the GitHub release text: the changelog section of the version
//   store-notes.txt   "What's new" for the Microsoft Store: the top-level bullets, plain text, max 1500 characters
//   store-listing.json  description, short description and search terms from docs/STORE-LISTING.md
//
// The same functions are tested in notes.test.mjs.
import fs from "node:fs";
import path from "node:path";

/** The `## [version]` section of the changelog (without its heading), or null. */
export function changelogSection(changelog, version) {
  const lines = changelog.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
  if (start === -1) return null;
  let end = lines.findIndex((l, i) => i > start && l.startsWith("## ["));
  if (end === -1) end = lines.length;
  return lines
    .slice(start + 1, end)
    .join("\n")
    .trim();
}

/** Markdown without its marks: `**bold**`, `code`, links and wiki-links become plain words. */
export function plain(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** The top-level bullets under Added and Changed, each as one plain line. */
export function bullets(section) {
  const out = [];
  let on = false;
  let current = null;
  const flush = () => {
    if (current !== null) out.push(plain(current));
    current = null;
  };
  for (const line of section.split("\n")) {
    const h = /^###\s+(.*)$/.exec(line);
    if (h) {
      flush();
      on = /^(Added|Changed)$/i.test(h[1].trim());
      continue;
    }
    if (!on) continue;
    if (/^- /.test(line)) {
      flush();
      current = line.slice(2);
    } else if (current !== null && /^\s+\S/.test(line)) current += ` ${line.trim()}`;
    else if (line.trim() === "") flush();
  }
  flush();
  return out;
}

/** The Store's "What's new": bullets, cut at whole bullets so that it fits `max` characters. */
export function storeNotes(section, max = 1500) {
  const lines = [];
  let size = 0;
  for (const b of bullets(section)) {
    const line = `• ${b}`;
    if (size + line.length + 1 > max) break;
    lines.push(line);
    size += line.length + 1;
  }
  return lines.join("\n");
}

/** The text under a `## Heading` of the Store listing file, without the next heading. */
export function listingPart(listing, heading) {
  const lines = listing.split("\n");
  const start = lines.findIndex((l) => l === `## ${heading}`);
  if (start === -1) return "";
  let end = lines.findIndex((l, i) => i > start && l.startsWith("## "));
  if (end === -1) end = lines.length;
  return lines
    .slice(start + 1, end)
    .join("\n")
    .trim();
}

/** The Store listing as the Store wants it: the plain text of the description and the search terms. */
export function storeListing(listing) {
  const text = (md) => md.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\n{3,}/g, "\n\n");
  return {
    shortDescription: listingPart(listing, "Short description"),
    description: text(listingPart(listing, "Description")),
    keywords: listingPart(listing, "Search terms (up to seven)")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 7),
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)
) {
  const [version, outDir] = process.argv.slice(2);
  if (!version || !outDir) {
    console.error("Use: node scripts/release/notes.mjs <version> <out-dir>");
    process.exit(2);
  }
  const section = changelogSection(fs.readFileSync("CHANGELOG.md", "utf8"), version);
  if (section === null) {
    console.error(`CHANGELOG.md has no section for ${version}.`);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "release-notes.md"),
    `${section}\n\nThe Windows installer (\`*-setup.exe\`) installs per user without administrator rights. Builds are unsigned.\n`,
  );
  fs.writeFileSync(path.join(outDir, "store-notes.txt"), `${storeNotes(section)}\n`);
  fs.writeFileSync(
    path.join(outDir, "store-listing.json"),
    JSON.stringify(storeListing(fs.readFileSync("docs/STORE-LISTING.md", "utf8")), null, 2),
  );
  console.log(`Wrote the release texts for ${version} in ${outDir}.`);
}
