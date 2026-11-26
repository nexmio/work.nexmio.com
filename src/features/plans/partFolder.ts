import { fileNameFrom } from "@/lib/noteTitle";

/**
 * The folder offered for a new page of a part: one folder for each part from the top down to it,
 * under `base`. A folder that is there with other capitals is used as it is written, because files
 * and folders never differ only by case.
 */
export function partFolder(
  base: string,
  trail: readonly string[],
  folders: readonly string[],
): string {
  return trail.reduce((path, words) => {
    const next = `${path === "" ? "" : `${path}/`}${fileNameFrom(words)}`;
    return folders.find((f) => f.toLowerCase() === next.toLowerCase()) ?? next;
  }, base);
}
