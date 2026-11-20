import { useEffect } from "react";
import { api } from "@/lib/api";
import { noteName, stepsFromAnswer, taskText } from "@/lib/taskLogic";
import { useAiJobStore } from "@/stores/aiJobStore";
import { useUiStore } from "@/stores/uiStore";
import { useTaskStore } from "@/stores/taskStore";
import { useVaultStore } from "@/stores/vaultStore";

const STEPS_INSTRUCTION =
  "Read the page below (and the page it came from, if it is given). Suggest the next tasks that are still missing to get the work done. Write each as one short line that starts with '- ' and a verb. Do not repeat tasks that are already in it, and do not invent facts. Put the very first one first. If nothing is missing, answer exactly NONE. Write in the language of the page.";

const INSTRUCTION =
  "List the tasks in this page: things that someone has to do. Write each task as one short line that starts with '- ' and a verb. Add who does it, or when, in a few words only if the page says so. Do not invent tasks. Leave out things that are already ticked. If there are no tasks, answer exactly NONE. Write in the language of the page.";

/** The most of a note that is sent to the AI. */
const MAX_CHARS = 12_000;

/** What the AI reads: the selection or the page, and for steps the page the epic came from. */
async function readFor(path: string, mode: "tasks" | "steps", selection: string | null) {
  let content = selection ?? (await api.readNote(path)).content;
  if (mode === "steps") {
    // The note the epic came from tells what the work is about.
    const epic = useTaskStore.getState().epics.find((e) => e.path === path);
    const from = epic?.source ? useVaultStore.getState().resolver.resolve(epic.source) : null;
    if (from !== null) {
      const origin = (await api.readNote(from)).content.slice(0, MAX_CHARS / 2);
      content = `The epic's page:\n${content}\n\nThe page it came from (${noteName(from)}):\n${origin}`;
    }
  }
  return content.slice(0, MAX_CHARS);
}

/**
 * "Find tasks in this page" (or "Suggest steps from the page" on an epic): the AI reads the page
 * in the AI queue, so nothing waits on the screen. In the Queue you tick which tasks to keep, and
 * only those are added, as checklist lines, to the epic of the page (steps go into the epic).
 */
export function findTasks(path: string, mode: "tasks" | "steps", selection: string | null): string {
  return useAiJobStore.getState().addPick({
    label: mode === "steps" ? "Suggest steps from the page" : "Find tasks in this page",
    where: noteName(path),
    instruction: mode === "steps" ? STEPS_INSTRUCTION : INSTRUCTION,
    read: () => readFor(path, mode, selection),
    notePath: path,
    parse: (answer) => ({
      points: [],
      items: /^\s*NONE\b/i.test(answer) ? [] : stepsFromAnswer(answer),
    }),
    noun: ["task", "tasks"],
    addTo: " to the epic",
    add: async (chosen) => {
      // Tasks found in an ordinary page go into the epic made for it; steps go into the epic.
      const target = mode === "steps" ? path : await useTaskStore.getState().epicFor(path);
      if (target === null) return;
      await useTaskStore.getState().addToNote(target, chosen.map(taskText));
    },
    goTo: () => {
      void useVaultStore.getState().openNote(path);
    },
  });
}

/**
 * Answers "Find tasks" wherever it is asked (the page's AI menu, the command palette, an epic):
 * the job is put in the AI queue at once and the request is closed. It shows nothing itself.
 */
export function FindTasksDialog() {
  const open = useUiStore((s) => s.findTasksOpen);
  const opts = useUiStore((s) => s.findTasksOpts);
  const active = useVaultStore((s) => s.activePath);
  const path = opts.path ?? active;
  useEffect(() => {
    if (!open) return;
    const ui = useUiStore.getState();
    if (path !== null) findTasks(path, opts.mode, ui.findTasksIn);
    ui.setFindTasksOpen(false);
  }, [open, path, opts.mode]);
  return null;
}
