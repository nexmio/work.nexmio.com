import type { Task } from "@/bindings/Task";
import { api } from "@/lib/api";
import { stepsFromAnswer } from "@/lib/taskLogic";
import { useAiJobStore } from "@/stores/aiJobStore";
import { useTaskStore } from "@/stores/taskStore";
import { noteTitle } from "@/lib/utils";

export const BREAK_DOWN_INSTRUCTION =
  "Break the task into 3 to 6 small, concrete steps. Use what the page says, so the steps fit it. Each step starts with a verb and can be done in 5 to 50 minutes. Put the very first step first. Answer with one step per line, starting with '- ', and nothing else. Write in the language of the task.";

export const SMALLER_INSTRUCTION =
  "Break the task into 4 to 8 VERY small steps, each doable in under 15 minutes. Put the very first step first. Answer with one step per line, starting with '- ', and nothing else. Write in the language of the task.";

/** The most of the note that is sent along with the task. */
const NOTE_CHARS = 6_000;

/** The task as it is now (its line may have moved), or the one that was asked about. */
function fresh(t: Task): Task {
  const tasks = useTaskStore.getState().tasks;
  return (
    tasks.find((x) => x.path === t.path && x.line === t.line && x.title === t.title) ??
    tasks.find((x) => x.path === t.path && x.title === t.title) ??
    t
  );
}

/** What the AI reads: the task, its steps and the note it is in, so the steps fit the note. */
export async function taskContext(asked: Task): Promise<string> {
  const t = fresh(asked);
  const have =
    t.steps.length > 0
      ? `\nSteps already there:\n${t.steps.map((s) => `- ${s.text}`).join("\n")}`
      : "";
  let note = "";
  try {
    note = (await api.readNote(t.path)).content.slice(0, NOTE_CHARS);
  } catch {
    // The title alone is enough to go on.
  }
  return `Task: ${t.title}${have}${note === "" ? "" : `\n\nThe page the task is in:\n---\n${note}\n---`}`;
}

/**
 * "Break it down" on a task: the AI proposes small steps in the AI queue (nothing waits on the
 * screen), you tick which stay in the Queue, and only those are written under the task.
 */
export function breakDownTask(task: Task): string {
  return useAiJobStore.getState().addPick({
    label: `Break it down: ${task.title}`,
    where: noteTitle(task.path),
    instruction: BREAK_DOWN_INSTRUCTION,
    read: () => taskContext(task),
    notePath: task.path,
    parse: (answer) => ({ points: [], items: stepsFromAnswer(answer) }),
    noun: ["step", "steps"],
    addTo: " to the task",
    firstIsStart: true,
    other: { label: "Make the steps smaller", instruction: SMALLER_INSTRUCTION },
    add: async (chosen) => {
      // One at a time: each step goes under the task, in order, and the task's line stays the same.
      for (const text of chosen) await useTaskStore.getState().addStep(fresh(task), text);
    },
    goTo: () => {
      useTaskStore.getState().open(fresh(task));
    },
  });
}
