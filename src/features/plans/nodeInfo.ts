import type { Task } from "@/bindings/Task";
import type { LinkResolver } from "@/lib/links";
import { splitText, type PlanNode } from "@/lib/planTree";
import type { EpicGroup } from "@/lib/taskLogic";
import { isInside } from "@/lib/utils";

/** What the rest of Nexmio Work says about an idea: the epic and notes it points at, and its task. */
export interface NodeInfo {
  plain: string;
  /** The epic the idea links to, with how far it has come. */
  epic: { path: string; title: string; done: number; total: number } | null;
  /** The other notes the idea links to (their paths). */
  notes: string[];
  /** The task of the plan's own epic that has the idea's words as its title. */
  task: Task | null;
  /**
   * The paths of what the idea is tied to that are outside the plan's project (a page, or the epic
   * note a task is in). Null for a plan in no project, where there is no inside or outside.
   */
  outside: ReadonlySet<string> | null;
}

/** What `infoFor` needs to know about the rest of the vault. */
export interface InfoContext {
  resolver: LinkResolver;
  groups: readonly EpicGroup[];
  /** The epic made for the plan (`epicFor`), when there is one. */
  planEpic: string | null;
  tasks: readonly Task[];
  /** The folder of the plan's project, or null for a plan in no project. */
  projectFolder: string | null;
}

/** The target of a link to the note at `path`: the path without `.md`. */
export function linkTarget(path: string): string {
  return path.replace(/\.md$/i, "");
}

/** The target of a link to the task `title` in the note at `path`: `note#title`. */
export function taskTarget(path: string, title: string): string {
  return `${linkTarget(path)}#${title}`;
}

export function infoFor(node: PlanNode, ctx: InfoContext): NodeInfo {
  const { plain, links } = splitText(node.text);
  let epic: NodeInfo["epic"] = null;
  let linked: Task | null = null;
  const notes: string[] = [];
  for (const target of links) {
    const hash = target.indexOf("#");
    if (hash > 0) {
      // A link to a task: `note#title`.
      const path = ctx.resolver.resolve(target.slice(0, hash));
      const title = target.slice(hash + 1);
      const hit = ctx.tasks.find((t) => t.path === path && t.title === title);
      if (hit) linked ??= hit;
      continue;
    }
    const path = ctx.resolver.resolve(target);
    if (path === null) continue;
    const group = ctx.groups.find((g) => g.path === path);
    if (group && epic === null) {
      epic = { path, title: group.title, done: group.done, total: group.total };
    } else notes.push(path);
  }
  const task =
    linked ??
    (ctx.planEpic === null
      ? null
      : (ctx.tasks.find((t) => t.path === ctx.planEpic && t.title === plain) ?? null));
  const folder = ctx.projectFolder;
  let outside: Set<string> | null = null;
  if (folder !== null) {
    // The folder decides, not the tag. The plan's own epic belongs to it wherever it is.
    const away = (path: string): boolean => path !== ctx.planEpic && !isInside(path, folder);
    const tied = [...notes, epic?.path, task?.path].filter((p) => p !== undefined);
    outside = new Set(tied.filter(away));
  }
  return { plain, epic, notes, task, outside };
}

/**
 * The first open task a plan points at, in the order of the list: under an idea that links to an
 * epic, its first open task; or a task of the plan's own epic made from an idea.
 */
export function firstStep(
  nodes: readonly PlanNode[],
  ctx: InfoContext,
): { task: Task; idea: string } | null {
  for (const n of nodes) {
    const info = infoFor(n, ctx);
    if (info.task && !info.task.done && info.task.status !== "dropped") {
      return { task: info.task, idea: info.plain };
    }
    if (info.epic) {
      const group = ctx.groups.find((g) => g.path === info.epic?.path);
      const t = group?.tasks.find((x) => !x.done && x.status !== "dropped");
      if (t) return { task: t, idea: info.plain };
    }
    const inner = firstStep(n.children, ctx);
    if (inner) return inner;
  }
  return null;
}
