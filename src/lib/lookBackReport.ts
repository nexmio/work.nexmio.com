import type { Project } from "@/bindings/Project";
import { api } from "@/lib/api";
import {
  lookBack,
  reportMarkdown,
  weekOf,
  weekSeconds,
  type LookBack,
  type Week,
} from "@/lib/lookBack";
import { todayIso } from "@/lib/taskLogic";
import { useAiJobStore, type AiPicks } from "@/stores/aiJobStore";
import { useMeetingStore } from "@/stores/meetingStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

export const REPORT_INSTRUCTION =
  "Below is what a person did in a week, as a list. Write a short status report from it for their team: three to six sentences in one or two paragraphs, what moved forward, what was decided and what is waiting. Use only what the list says; do not invent anything and leave out numbers that are not in it. Write in the language of the task and page names in the list (not the language of the headings). Answer with the report only.";

/** Reads the week from the vault: the tasks and meetings as loaded, the pages from the history. */
export async function readWeek(
  offset: number,
  project: Project | null,
  leaveOut: readonly Project[] = [],
): Promise<{ week: Week; data: LookBack }> {
  const week = weekOf(offset);
  if (!useTaskStore.getState().loaded) await useTaskStore.getState().load();
  if (!useMeetingStore.getState().loaded) await useMeetingStore.getState().load();
  const span = weekSeconds(week);
  const pages = await api.changedPages(span.from, span.to);
  const { tasks, epics } = useTaskStore.getState();
  const data = lookBack({
    week,
    today: todayIso(),
    tasks,
    epics,
    meetings: useMeetingStore.getState().meetings,
    pages,
    project,
    leaveOut,
  });
  return { week, data };
}

/** The report's paragraphs from the AI's answer. */
export function reportParagraphs(answer: string): AiPicks {
  return {
    points: answer
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
      .filter((p) => p !== ""),
    items: [],
  };
}

/**
 * "Write it for me": the AI writes a short status report of a week in the AI queue. It gets only
 * the list Look back made (never the pages). Nothing is written unless the person saves it as a
 * page.
 */
export function writeReport(offset: number, project: Project | null): string {
  const week = weekOf(offset);
  return useAiJobStore.getState().addPick({
    label: "Status report",
    where: `Week ${String(week.number)}${project ? ` · ${project.name}` : ""}`,
    instruction: REPORT_INSTRUCTION,
    read: async () => {
      // A cloud AI may be used for a list of all projects: what a Local AI only project did is
      // then left out. A chosen project's own rules decide (its folder is the page asked about).
      const cloud = useSettingsStore.getState().settings?.ai.cloudConsent != null;
      const leaveOut =
        project === null && cloud
          ? useVaultStore.getState().projects.filter((p) => p.localOnly)
          : [];
      const { data } = await readWeek(offset, project, leaveOut);
      return reportMarkdown(data, week, project);
    },
    // A page path inside the project, so its AI rules (Local AI only) apply to the report.
    notePath: project === null ? null : `${project.folder}/Status.md`,
    parse: reportParagraphs,
    noun: ["paragraph", "paragraphs"],
    addTo: "",
    add: () => Promise.resolve(),
    copy: (picks) => picks.points.join("\n\n"),
    text: {
      title: "The report",
      save: {
        label: "Save as a page",
        run: async (picks) => {
          const vault = useVaultStore.getState();
          const folder = vault.vault?.config.quickNotesFolder ?? "";
          const title = `Status week ${String(week.number)}${project ? ` ${project.name}` : ""}`;
          const path = await api.createNote(folder, title);
          await api.writeNote(path, `# ${title}\n\n${picks.points.join("\n\n")}\n`);
          await vault.refreshTree();
          await vault.openNote(path);
        },
      },
    },
    goTo: () => {
      useUiStore.getState().setCenterView("lookback");
    },
  });
}
