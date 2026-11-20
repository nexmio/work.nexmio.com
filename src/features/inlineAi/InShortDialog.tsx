import { useEffect } from "react";
import { api } from "@/lib/api";
import {
  IN_SHORT_INSTRUCTION,
  IN_SHORT_MAX_CHARS,
  inShortMarkdown,
  parseInShort,
} from "@/lib/inShort";
import { noteName, taskText } from "@/lib/taskLogic";
import { useAiJobStore } from "@/stores/aiJobStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

/**
 * "In short" for a page, in the AI queue: the AI reads the page and gives its main points and
 * the things to do. Nothing is written to the page. In the Queue the things to do are ticked,
 * and only those become tasks, in the epic of the page.
 */
export function inShort(path: string): string {
  return useAiJobStore.getState().addPick({
    label: "In short",
    where: noteName(path),
    instruction: IN_SHORT_INSTRUCTION,
    read: async () => (await api.readNote(path)).content.slice(0, IN_SHORT_MAX_CHARS),
    notePath: path,
    parse: (answer) => {
      const r = parseInShort(answer);
      return { points: r.points, items: r.todos };
    },
    noun: ["task", "tasks"],
    addTo: " to the epic",
    copy: (picks) => inShortMarkdown({ points: picks.points, todos: picks.items }),
    add: async (chosen) => {
      const target = await useTaskStore.getState().epicFor(path);
      if (target === null) return;
      await useTaskStore.getState().addToNote(target, chosen.map(taskText));
    },
    goTo: () => {
      void useVaultStore.getState().openNote(path);
    },
  });
}

/**
 * Answers "In short" from the AI menu of the open page: the job is put in the AI queue at once
 * and the request is closed. It shows nothing itself.
 */
export function InShortDialog() {
  const open = useUiStore((s) => s.inShortOpen);
  const active = useVaultStore((s) => s.activePath);
  useEffect(() => {
    if (!open) return;
    if (active !== null) inShort(active);
    useUiStore.getState().setInShortOpen(false);
  }, [open, active]);
  return null;
}
