import type { Task } from "@/bindings/Task";
import { api } from "@/lib/api";
import { fileNameFrom } from "@/lib/noteTitle";
import {
  addChild,
  indentAt,
  joinText,
  moveBy,
  nodeAt,
  outdentAt,
  removeAt,
  sameName,
  setNote,
  setText,
  splitText,
  type NodePath,
  type PlanNode,
} from "@/lib/planTree";
import { useTaskStore } from "@/stores/taskStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { planHome, planTag, usePlanStore } from "@/stores/planStore";
import { linkTarget, taskTarget } from "./nodeInfo";
import { suggestParts } from "./suggestParts";

/** The words of the idea at `path` in the open plan. */
export function plainAt(path: NodePath): string {
  const n = nodeAt(usePlanStore.getState().nodes, path);
  return n ? splitText(n.text).plain : "";
}

/** Writes a link to the note at `notePath` on the idea at `path`. */
export async function linkNoteTo(path: NodePath, notePath: string): Promise<void> {
  const target = linkTarget(notePath);
  await usePlanStore.getState().edit((nodes) => {
    const n = nodeAt(nodes, path);
    if (!n) return nodes;
    const { plain, links } = splitText(n.text);
    if (links.includes(target)) return nodes;
    return setText(nodes, path, joinText(plain, [...links, target]));
  });
}

/** The tag of the open plan (its project's tag), or null when no plan is open. */
export function openPlanTag(): string | null {
  const { path, title } = usePlanStore.getState();
  return path === null ? null : planTag(path, title);
}

/** Task lines made from the open plan, each with the plan's `#tag` at its end. */
export function withPlanTag(texts: readonly string[]): string[] {
  const tag = openPlanTag();
  return tag === null ? [...texts] : texts.map((t) => `${t} #${tag}`);
}

/** Puts the open plan's tag on an epic it made or uses (nothing is written when it is there). */
async function tagEpic(epic: string): Promise<void> {
  const tag = openPlanTag();
  if (tag === null) return;
  const have = useTaskStore.getState().epics.find((e) => e.path === epic)?.tags ?? [];
  if (!have.includes(tag)) await useTaskStore.getState().setEpicTag(epic, tag, true);
}

/** The epic of a plan (named after it), made when it is not there: in the plan's project if it has one. */
export async function epicOfPlan(plan: string): Promise<string | null> {
  const folder = planHome(plan).epics;
  const epic = await (folder === undefined
    ? useTaskStore.getState().epicFor(plan)
    : useTaskStore.getState().epicFor(plan, folder));
  if (epic !== null) await tagEpic(epic);
  return epic;
}

/**
 * Makes a task of the idea: it is added to the epic made for the plan (the epic Nexmio Work makes for a
 * note, with a link back). The idea itself stays where it is and shows the task.
 */
export async function makeTask(path: NodePath): Promise<void> {
  const plan = usePlanStore.getState().path;
  const text = plainAt(path);
  if (plan === null || text === "") return;
  const epic = await epicOfPlan(plan);
  if (epic === null) return;
  await useTaskStore.getState().addToNote(epic, withPlanTag([text]));
  await useTaskStore.getState().load();
  const made = useTaskStore.getState().tasks.find((t) => t.path === epic && t.title === text);
  if (made) await linkTaskTo(path, made);
  useUiStore.getState().toast(`Made the task “${text}”.`, "success");
}

/** Ties an existing task to the idea (a task the idea had before is let go). */
export async function linkTaskTo(path: NodePath, task: Task): Promise<void> {
  const target = taskTarget(task.path, task.title);
  await usePlanStore.getState().edit((nodes) => {
    const n = nodeAt(nodes, path);
    if (!n) return nodes;
    const { plain, links } = splitText(n.text);
    const keep = links.filter((l) => !l.includes("#"));
    return setText(nodes, path, joinText(plain, [...keep, target]));
  });
}

/** Makes a note named after the idea, next to the plan, and links the idea to it. */
export async function makeNote(path: NodePath): Promise<void> {
  const plan = usePlanStore.getState();
  const text = plainAt(path);
  if (plan.path === null || text === "") return;
  try {
    const folder = planHome(plan.path).notes;
    const taken = new Set(useVaultStore.getState().files);
    const name = fileNameFrom(text);
    let note = `${folder === "" ? "" : `${folder}/`}${name}.md`;
    for (let i = 2; taken.has(note); i++) {
      note = `${folder === "" ? "" : `${folder}/`}${name} ${String(i)}.md`;
    }
    const tag = planTag(plan.path, plan.title);
    await api.writeNote(
      note,
      `---\ntags: [${tag}]\n---\n# ${text}\n\nPart of [[${linkTarget(plan.path)}]].\n\n`,
    );
    await useVaultStore.getState().refreshTree();
    await linkNoteTo(path, note);
    useUiStore.getState().toast(`Made the page “${text}”.`, "success", {
      label: "Open",
      run: () => {
        void useVaultStore.getState().openNote(note);
      },
    });
  } catch (e) {
    reportError(e);
  }
}

/** Takes the idea out, with everything under it. The note's History has it. */
export async function removeIdea(path: NodePath): Promise<void> {
  const text = plainAt(path);
  const ok = await usePlanStore.getState().edit((nodes) => ({
    nodes: removeAt(nodes, path),
    path: null,
  }));
  if (ok) {
    useUiStore
      .getState()
      .toast(`Deleted “${text}”. It is in the plan's History if you want it back.`, "success");
  }
}

/** Writes the short note of a part (an empty note takes it away). */
export const saveNote = (path: NodePath, note: string) =>
  usePlanStore.getState().edit((nodes) => setNote(nodes, path, note));

export const move = (path: NodePath, delta: -1 | 1) =>
  usePlanStore.getState().edit((nodes) => moveBy(nodes, path, delta));
export const indent = (path: NodePath) =>
  usePlanStore.getState().edit((nodes) => indentAt(nodes, path));
export const outdent = (path: NodePath) =>
  usePlanStore.getState().edit((nodes) => outdentAt(nodes, path));

/** Adds an idea as the last one under `parent` (the top level for `[]`). */
export async function addIdea(parent: NodePath, text: string): Promise<boolean> {
  const t = text.trim();
  if (t === "") return false;
  return usePlanStore.getState().edit((nodes) => addChild(nodes, parent, t));
}

/** Adds a whole tree of ideas as the last ones under `parent` (the top level for `[]`). */
export async function addTree(parent: NodePath, tree: readonly PlanNode[]): Promise<void> {
  if (tree.length === 0) return;
  let left = 0;
  await usePlanStore.getState().edit((nodes) => {
    let acc = nodes;
    const add = (at: NodePath, list: readonly PlanNode[]): void => {
      for (const n of list) {
        // A part whose name is already there under the same part is left out.
        const have = at.length === 0 ? acc : (nodeAt(acc, at)?.children ?? []);
        if (have.some((m) => sameName(m.text, n.text))) {
          left += 1;
          continue;
        }
        const r = addChild(acc, at, n.text);
        acc = r.nodes;
        add(r.path, n.children);
      }
    };
    add(parent, tree);
    return acc;
  });
  if (left > 0) {
    useUiStore
      .getState()
      .toast(`Left out ${String(left)} part(s) whose name was already there.`, "info");
  }
}

/** One entry of the menu of an idea. */
export interface NodeAction {
  id: string;
  label: string;
  run: () => void;
  needsAi?: boolean;
}

/** What can be done with the idea at `path` (the same in the outline's menu and the map's panel). */
export function nodeActions(path: NodePath): NodeAction[] {
  const store = usePlanStore.getState();
  return [
    {
      id: "parts",
      label: "Break it down…",
      needsAi: true,
      run: () => {
        suggestParts(path);
      },
    },
    {
      id: "sub",
      label: "Add a part",
      run: () => {
        store.setAdding(path);
      },
    },
    {
      id: "task",
      label: "Link or make a task…",
      run: () => {
        store.setDialog({ kind: "linktask", path });
      },
    },
    {
      id: "link",
      label: "Link or make a page…",
      run: () => {
        store.setDialog({ kind: "link", path });
      },
    },
    {
      id: "note",
      label: "Write a note…",
      run: () => {
        store.setDialog({ kind: "note", path });
      },
    },
    {
      id: "repeat",
      label: "Repeat these steps for…",
      run: () => {
        store.setDialog({ kind: "repeat", path });
      },
    },
    {
      id: "up",
      label: "Move up",
      run: () => {
        void move(path, -1);
      },
    },
    {
      id: "down",
      label: "Move down",
      run: () => {
        void move(path, 1);
      },
    },
    {
      id: "in",
      label: "Under the one before",
      run: () => {
        void indent(path);
      },
    },
    {
      id: "out",
      label: "One level up",
      run: () => {
        void outdent(path);
      },
    },
    {
      id: "delete",
      label: "Delete",
      run: () => {
        void removeIdea(path);
      },
    },
  ];
}
