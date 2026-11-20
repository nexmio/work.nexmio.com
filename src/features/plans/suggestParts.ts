import { api } from "@/lib/api";
import {
  addChild,
  nodeAt,
  parsePlan,
  planTitle,
  sameName,
  splitText,
  walk,
  type NodePath,
  type PlanNode,
} from "@/lib/planTree";
import { stepsFromAnswer } from "@/lib/taskLogic";
import { noteTitle } from "@/lib/utils";
import { useAiJobStore, type AiPickSpec } from "@/stores/aiJobStore";
import { usePlanStore } from "@/stores/planStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

/** The most of the plan page, and of each linked page, that the AI reads. */
const PLAN_CHARS = 8_000;
const PAGE_CHARS = 2_000;
/** The most linked pages that are read along. */
const MAX_PAGES = 4;

export const PARTS_INSTRUCTION =
  "You help someone break a plan down. Below is the whole plan as an outline, the part marked <<< THIS PART >>>, and what is linked to it. Suggest the parts that THIS PART is made of: only things that belong to this part. Use the rest of the plan to know what this part covers and what it does not. Leave out anything that is already somewhere in the plan, and anything that belongs better under another part of the plan. Write each part as one short line that starts with '- ' (one to six words, no full sentences). At most eight. Do not invent facts. If nothing is missing, answer exactly NONE. Write in the language of the plan.";

/** The words of each part from the top down to the one at `path` (empty for the plan itself). */
export function trailOf(nodes: readonly PlanNode[], path: NodePath): string[] {
  const out: string[] = [];
  for (let i = 1; i <= path.length; i++) {
    const n = nodeAt(nodes, path.slice(0, i));
    if (!n) return out;
    out.push(splitText(n.text).plain);
  }
  return out;
}

/** Finds a part again by its words and those above it (the list may have changed meanwhile). */
export function pathOf(nodes: readonly PlanNode[], trail: readonly string[]): NodePath | null {
  let level = nodes;
  const path: number[] = [];
  for (const words of trail) {
    const i = level.findIndex((n) => sameName(splitText(n.text).plain, words));
    const n = level[i];
    if (!n) return null;
    path.push(i);
    level = n.children;
  }
  return path;
}

/** The plan as an indented outline of words (links left out), with the chosen part marked. */
export function outlineFor(title: string, nodes: readonly PlanNode[], path: NodePath): string {
  const lines = [path.length === 0 ? `${title} <<< THIS PART >>>` : title];
  for (const { path: p, node } of walk(nodes)) {
    const mark = p.length === path.length && p.every((x, i) => x === path[i]);
    const words = splitText(node.text).plain;
    lines.push(`${"  ".repeat(p.length)}- ${words}${mark ? " <<< THIS PART >>>" : ""}`);
    if (node.note !== undefined && node.note !== "") {
      lines.push(`${"  ".repeat(p.length + 1)}(note: ${node.note.replace(/\s+/g, " ")})`);
    }
  }
  return lines.join("\n");
}

/** The pages linked to the part and to the parts above it, nearest first (no task links). */
export function linkedPages(nodes: readonly PlanNode[], path: NodePath): string[] {
  const resolver = useVaultStore.getState().resolver;
  const out: string[] = [];
  for (let i = path.length; i >= 1; i--) {
    const n = nodeAt(nodes, path.slice(0, i));
    for (const target of n ? splitText(n.text).links : []) {
      if (target.includes("#")) continue;
      const p = resolver.resolve(target);
      if (p !== null && !out.includes(p)) out.push(p);
    }
  }
  return out.slice(0, MAX_PAGES);
}

/**
 * What the AI reads to suggest parts: the whole plan as an outline with the chosen part marked,
 * the plan's own page (the lines round the list say what it is about), the pages linked to the
 * part and to the parts above it, and the tasks of the plan's epic. It is read when the job
 * starts, so it is the newest plan.
 */
async function contextFor(planPath: string, trail: readonly string[]): Promise<string> {
  const page = (await api.readNote(planPath)).content;
  const nodes = parsePlan(page).nodes;
  const title = planTitle(page, noteTitle(planPath));
  const path = pathOf(nodes, trail) ?? [];
  const parts = [
    `The plan:\n${outlineFor(title, nodes, path)}`,
    `The plan's page:\n---\n${page.slice(0, PLAN_CHARS)}\n---`,
  ];
  for (const p of linkedPages(nodes, path)) {
    try {
      const content = (await api.readNote(p)).content.slice(0, PAGE_CHARS);
      parts.push(`A page linked to it (${p}):\n---\n${content}\n---`);
    } catch {
      // A page that cannot be read is left out.
    }
  }
  // The epic made for the plan points back at it.
  const resolver = useVaultStore.getState().resolver;
  const epic = useTaskStore
    .getState()
    .epics.find((e) => e.source !== null && resolver.resolve(e.source) === planPath);
  const tasks = useTaskStore
    .getState()
    .tasks.filter((t) => epic !== undefined && t.path === epic.path)
    .map((t) => `- ${t.title}${t.done ? " (done)" : ""}`);
  if (tasks.length > 0) parts.push(`The tasks of the plan:\n${tasks.join("\n")}`);
  return parts.join("\n\n");
}

/** Opens the plan again with the part chosen, on the map. */
async function goBack(planPath: string, trail: readonly string[]): Promise<void> {
  const store = usePlanStore.getState();
  if (store.path !== planPath) await store.open(planPath);
  else useUiStore.getState().openArea("plans");
  const now = usePlanStore.getState();
  now.setView("map");
  now.select(pathOf(now.nodes, trail) ?? []);
  useUiStore.getState().setRightTab("part");
}

/**
 * Asks the AI for the parts of the part at `path` (the plan itself for `[]`), in the AI queue:
 * nothing waits on the screen, and the list is ticked in the Queue. The part is found again by
 * its words when the parts are added, so a plan that was changed meanwhile gets them in the
 * right place.
 */
export function suggestParts(path: NodePath): string | null {
  const { path: planPath, title, nodes } = usePlanStore.getState();
  if (planPath === null) return null;
  const trail = trailOf(nodes, path);
  const what = path.length === 0 ? title : (trail[trail.length - 1] ?? title);
  const spec: AiPickSpec = {
    label: path.length === 0 ? "Suggest parts" : `Break it down: ${what}`,
    where: [title, ...trail].join(" › "),
    instruction: PARTS_INSTRUCTION,
    read: () => contextFor(planPath, trail),
    notePath: planPath,
    parse: (answer) => ({
      points: [],
      items: /^\s*NONE\b/i.test(answer) ? [] : stepsFromAnswer(answer),
    }),
    noun: ["part", "parts"],
    addTo: ` to “${what}”`,
    add: async (chosen) => {
      if (usePlanStore.getState().path !== planPath) await usePlanStore.getState().open(planPath);
      const lost = { part: false };
      const ok = await usePlanStore.getState().edit((list) => {
        const at = pathOf(list, trail);
        if (at === null) {
          lost.part = true;
          return list;
        }
        const have = (at.length === 0 ? list : (nodeAt(list, at)?.children ?? [])).map(
          (c) => splitText(c.text).plain,
        );
        return chosen
          .filter((t) => !have.some((h) => sameName(h, t)))
          .reduce((acc, t) => addChild(acc, at, t).nodes, list);
      });
      if (lost.part) {
        throw new Error(`“${what}” is no longer in the plan, so the parts were not added.`);
      }
      if (ok) useUiStore.getState().toast(`Added to “${what}”.`, "success");
    },
    goTo: () => {
      void goBack(planPath, trail);
    },
  };
  return useAiJobStore.getState().addPick(spec);
}
