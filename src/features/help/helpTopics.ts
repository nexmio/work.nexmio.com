import exportMd from "./topics/export.md?raw";
import historyMd from "./topics/history.md?raw";
import builtinMd from "./topics/builtin.md?raw";
import helperMd from "./topics/helper.md?raw";
import imagesMd from "./topics/images.md?raw";
import importMd from "./topics/import.md?raw";
import mermaidMd from "./topics/mermaid.md?raw";
import linksMd from "./topics/links.md?raw";
import aiMd from "./topics/ai.md?raw";
import projectsMd from "./topics/projects.md?raw";
import searchMd from "./topics/search.md?raw";
import shortcutsMd from "./topics/shortcuts.md?raw";
import startMd from "./topics/start.md?raw";
import plansMd from "./topics/plans.md?raw";
import tasksMd from "./topics/tasks.md?raw";
import templatesMd from "./topics/templates.md?raw";
import titleMd from "./topics/title.md?raw";
import vaultsMd from "./topics/vaults.md?raw";
import writingMd from "./topics/writing.md?raw";

/**
 * One page of the how-to guide. `body` is Markdown: first the short steps, then, after the line
 * `<!-- more -->`, the details that are folded away.
 */
export interface HelpTopic {
  id: string;
  /** The heading it stands under in the list. */
  group: string;
  title: string;
  /** One line shown under the title in the list. */
  summary: string;
  body: string;
}

/** The guide, in the order it is shown: group by group. The text of each topic is in `topics/<id>.md`. */
export const HELP_TOPICS: readonly HelpTopic[] = [
  {
    id: "start",
    group: "Get started",
    title: "Getting started",
    summary: "Vaults, the window and saving",
    body: startMd,
  },
  {
    id: "vaults",
    group: "Get started",
    title: "Several vaults",
    summary: "Keep things apart, switch fast",
    body: vaultsMd,
  },
  {
    id: "search",
    group: "Get started",
    title: "Finding pages",
    summary: "Quick open, search and filters",
    body: searchMd,
  },
  {
    id: "shortcuts",
    group: "Get started",
    title: "Keyboard shortcuts",
    summary: "All shortcuts in one list",
    body: shortcutsMd,
  },
  {
    id: "writing",
    group: "Write",
    title: "Writing pages",
    summary: "The toolbar, Markdown and tables",
    body: writingMd,
  },
  {
    id: "title",
    group: "Write",
    title: "Naming a page",
    summary: "One name window, and names that clash",
    body: titleMd,
  },
  {
    id: "links",
    group: "Write",
    title: "Links and index pages",
    summary: "Link pages, make an index",
    body: linksMd,
  },
  {
    id: "images",
    group: "Write",
    title: "Images",
    summary: "Add, resize and tidy pictures",
    body: imagesMd,
  },
  {
    id: "mermaid",
    group: "Write",
    title: "Diagrams (Mermaid)",
    summary: "Draw a diagram yourself, with examples",
    body: mermaidMd,
  },
  {
    id: "tasks",
    group: "Plan and do",
    title: "Tasks",
    summary: "Epics, status, steps and time",
    body: tasksMd,
  },
  {
    id: "plans",
    group: "Plan and do",
    title: "Projects",
    summary: "Break something big down into parts",
    body: plansMd,
  },
  {
    id: "templates",
    group: "Plan and do",
    title: "Meetings and daily pages",
    summary: "Meetings, daily pages and templates",
    body: templatesMd,
  },
  {
    id: "ai",
    group: "AI",
    title: "The AI",
    summary: "Ask, attach pages, review changes",
    body: aiMd,
  },
  {
    id: "builtin",
    group: "AI",
    title: "The built-in AI",
    summary: "Nexmio Work without LM Studio: download, load, unload",
    body: builtinMd,
  },
  {
    id: "projects",
    group: "AI",
    title: "AI rules for a project",
    summary: "What the AI may know and use",
    body: projectsMd,
  },
  {
    id: "history",
    group: "Setup and safety",
    title: "Version history",
    summary: "Nothing is lost, restore anything",
    body: historyMd,
  },
  {
    id: "import",
    group: "Setup and safety",
    title: "Import from OneNote",
    summary: "Move your pages to Nexmio Work",
    body: importMd,
  },
  {
    id: "export",
    group: "Setup and safety",
    title: "Export and share",
    summary: "HTML, Word and PDF",
    body: exportMd,
  },
  {
    id: "helper",
    group: "Setup and safety",
    title: "The taskbar helper",
    summary: "Windows: keys that work in every program",
    body: helperMd,
  },
];

/** The topic with this id, or the first one. */
export function findTopic(id: string): HelpTopic {
  return HELP_TOPICS.find((t) => t.id === id) ?? (HELP_TOPICS[0] as HelpTopic);
}

/** Topics whose title, summary or text contains every word of `query` (without regard to case). */
export function searchTopics(query: string): readonly HelpTopic[] {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w !== "");
  if (words.length === 0) return HELP_TOPICS;
  return HELP_TOPICS.filter((t) => {
    const text = `${t.title} ${t.summary} ${t.body}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

/** The line in a topic that the details start after. */
const MORE = "<!-- more -->";

/** A topic's short steps, and its details (empty when it has none). */
export function topicParts(topic: Pick<HelpTopic, "body">): { steps: string; more: string } {
  const [steps = "", more = ""] = topic.body.split(MORE);
  return { steps: steps.trim(), more: more.trim() };
}
