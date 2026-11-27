/**
 * What a chip's tooltip says: what pressing it opens and, for a plan in a project, whether the
 * thing is in the project or outside it, with where it is.
 */
export function chipTitle(open: string, path: string, outside: ReadonlySet<string> | null): string {
  if (outside === null) return open;
  const where = outside.has(path) ? "Outside this project" : "In this project";
  return `${open}\n${where}: ${path}`;
}
