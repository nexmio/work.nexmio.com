import { useEffect } from "react";
import type { Task } from "@/bindings/Task";
import { TagPicker } from "@/components/TagPicker";
import { epicTagsOf, tagsOfTask } from "@/lib/taskLogic";
import { useTagStore } from "@/stores/tagStore";
import { useTaskStore } from "@/stores/taskStore";

/** The tags the vault uses, for the suggestions (read once when a picker is shown). */
function useSuggestions() {
  const tags = useTagStore((s) => s.tags);
  useEffect(() => {
    void useTagStore.getState().load();
  }, []);
  return tags;
}

/**
 * The tags of a task: its own (`#tag` in its line) and the ones it gets from its epic. The tags are
 * the same as on pages, so search finds a task's page with them too.
 */
export function TaskTags({ task }: { task: Task }) {
  const epics = useTaskStore((s) => s.epics);
  const suggestions = useSuggestions();
  const { own, inherited } = tagsOfTask(task, epics);
  return (
    <div className="flex flex-col gap-1">
      <span className="section-label">Tags</span>
      <TagPicker
        tags={own}
        inherited={inherited}
        suggestions={suggestions}
        onAdd={(tag) => {
          void useTaskStore.getState().setTaskTag(task, tag, true);
        }}
        onRemove={(tag) => {
          void useTaskStore.getState().setTaskTag(task, tag, false);
        }}
      />
    </div>
  );
}

/** The tags of an epic: they are written in the properties of its page, and cover all its tasks. */
export function EpicTags({ path }: { path: string }) {
  const epics = useTaskStore((s) => s.epics);
  const suggestions = useSuggestions();
  return (
    <div className="flex flex-col gap-1">
      <span className="section-label">Tags of this epic</span>
      <TagPicker
        tags={epicTagsOf(epics, path)}
        suggestions={suggestions}
        onAdd={(tag) => {
          void useTaskStore.getState().setEpicTag(path, tag, true);
        }}
        onRemove={(tag) => {
          void useTaskStore.getState().setEpicTag(path, tag, false);
        }}
      />
    </div>
  );
}
