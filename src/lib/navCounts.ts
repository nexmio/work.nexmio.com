import { useMemo } from "react";
import { groupMeetings } from "@/lib/meetingList";
import { isOpen, todayIso } from "@/lib/taskLogic";
import { useIdeaStore } from "@/stores/ideaStore";
import { useMeetingStore } from "@/stores/meetingStore";
import { useTaskStore } from "@/stores/taskStore";

/** The numbers shown beside the areas in the navigation. `null` means "nothing to show". */
export interface NavCounts {
  tasks: number | null;
  meetings: number | null;
  ideas: number | null;
}

/** `n` for the navigation, or `null` for 0 (no number is better than a zero). */
function shown(n: number): number | null {
  return n > 0 ? n : null;
}

/**
 * What waits in each area: open tasks that are not waiting, meetings today, open ideas. Reads only
 * what the stores already hold; nothing is loaded just for a number.
 */
export function useNavCounts(): NavCounts {
  const tasks = useTaskStore((s) => s.tasks);
  const tasksLoaded = useTaskStore((s) => s.loaded);
  const meetings = useMeetingStore((s) => s.meetings);
  const meetingsLoaded = useMeetingStore((s) => s.loaded);
  const ideas = useIdeaStore((s) => s.ideas);
  const ideasLoaded = useIdeaStore((s) => s.loaded);
  return useMemo(
    () => ({
      tasks: tasksLoaded
        ? shown(tasks.filter((t) => isOpen(t) && t.status !== "waiting").length)
        : null,
      meetings: meetingsLoaded ? shown(groupMeetings(meetings, todayIso()).today.length) : null,
      ideas: ideasLoaded ? shown(ideas.filter((i) => i.status === null).length) : null,
    }),
    [tasks, tasksLoaded, meetings, meetingsLoaded, ideas, ideasLoaded],
  );
}
