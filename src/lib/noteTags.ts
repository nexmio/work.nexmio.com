/**
 * The tags a note can be given from the Tags menu. A tag is only made when it can do something a
 * folder cannot (see docs/DECISIONS.md); a new one is one more entry here. The names are the words
 * written in the note's properties (`tags: [meeting]`).
 */
export interface NoteTag {
  tag: string;
  label: string;
  /** What it does, shown in the menu. */
  does: string;
  /** The button text when the word is written as `#tag` in the text, where it does nothing. */
  makeIt: string;
}

export const NOTE_TAGS: readonly NoteTag[] = [
  {
    tag: "meeting",
    label: "Meeting",
    does: "Start meeting shows, and the agenda is not read as tasks.",
    makeIt: "Make this page a meeting",
  },
  {
    tag: "epic",
    label: "Epic",
    does: "Its tasks are listed with your epics in Tasks.",
    makeIt: "Make this page an epic",
  },
  {
    tag: "pinned",
    label: "Pinned",
    does: "The page is listed under Pinned on the start page.",
    makeIt: "Pin to the start page",
  },
  {
    tag: "plan",
    label: "Plan",
    does: "Its list is the ideas of a plan, shown as an outline or a map under Projects.",
    makeIt: "Make this page a plan",
  },
  {
    tag: "plan-finished",
    label: "Plan finished",
    does: "The plan is listed under Archived in Projects.",
    makeIt: "Mark the plan as archived",
  },
];

/** The names of Nexmio Work's own tags: the tags that do something. Every other tag is the person's. */
export const SYSTEM_TAGS: readonly string[] = NOTE_TAGS.map((t) => t.tag);

/** Whether a tag is one of Nexmio Work's own (`meeting`, `epic`, `pinned`, `plan`). */
export function isSystemTag(tag: string): boolean {
  return SYSTEM_TAGS.includes(tag.toLowerCase());
}

/** The tags that are not Nexmio Work's own. */
export function userTags(tags: readonly string[]): string[] {
  return tags.filter((t) => !isSystemTag(t));
}

/**
 * A tag as it is written in a note: lower case, letters, digits, `-` and `_`, and nothing else
 * (the same as a `#tag` in the text). A leading `#` is dropped. Returns null when it is not a tag.
 */
export function cleanTagName(text: string): string | null {
  const t = text.trim().replace(/^#+/, "").toLowerCase();
  if (t === "" || !/^[\p{L}\p{N}_-]+$/u.test(t) || /^\d+$/.test(t)) return null;
  return t;
}

/**
 * The tag made from a name (a project or a plan): lower case, spaces and other marks as `-`, only
 * letters, digits, `-` and `_`. "project" when nothing is left. The same as `projects::tag_for`
 * in the backend.
 */
export function tagFor(name: string): string {
  let out = "";
  for (const c of name.trim().toLowerCase()) {
    if (/[\p{L}\p{N}_]/u.test(c)) out += c;
    else if (out !== "" && !out.endsWith("-")) out += "-";
  }
  const t = out.replace(/-+$/, "");
  return /\p{L}/u.test(t) ? t : "project";
}

/** The tag of a project: the one it was given when it was made, else one made from its name. */
export function projectTag(project: { tag?: string | null; name: string }): string {
  return project.tag ?? tagFor(project.name);
}

/** The `#tags` written in the text of a note (not in its properties or in code), lower case. */
export function textTags(content: string): string[] {
  const body = content
    .replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/, "")
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, " ")
    .replace(/`[^`\n]*`/g, " ");
  const found = new Set<string>();
  for (const m of body.matchAll(/(^|[\s(])#([\p{L}\p{N}_\-/]+)/gmu)) {
    const t = (m[2] ?? "").replace(/[/-]+$/, "").toLowerCase();
    if (t !== "" && !/^\d+$/.test(t)) found.add(t);
  }
  return [...found].sort();
}
