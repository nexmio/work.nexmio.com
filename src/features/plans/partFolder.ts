import { fileNameFrom } from "@/lib/noteTitle";

/** `path` as a folder that is there writes it: files and folders never differ only by case. */
function asWritten(path: string, folders: readonly string[]): string {
  return folders.find((f) => f.toLowerCase() === path.toLowerCase()) ?? path;
}

/**
 * The folder offered for a new page of a part: under `base`, one folder for each part above it.
 * The part itself gets no folder; it names the page (`partPagePath`).
 */
export function partFolder(
  base: string,
  trail: readonly string[],
  folders: readonly string[],
): string {
  return trail
    .slice(0, -1)
    .reduce(
      (path, words) => asWritten(`${path === "" ? "" : `${path}/`}${fileNameFrom(words)}`, folders),
      asWritten(base, folders),
    );
}

/**
 * The path of a new page of a part: `<part>_page.md` in `folder`, so it is never taken for the
 * folder of the parts under it. A number follows when a file has the name already.
 */
export function partPagePath(folder: string, part: string, files: readonly string[]): string {
  const stem = `${folder === "" ? "" : `${folder}/`}${fileNameFrom(part)}_page`;
  const taken = new Set(files.map((f) => f.toLowerCase()));
  let path = `${stem}.md`;
  for (let i = 2; taken.has(path.toLowerCase()); i++) path = `${stem} ${String(i)}.md`;
  return path;
}
