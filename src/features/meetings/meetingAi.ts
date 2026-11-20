import { api } from "@/lib/api";
import { flushPendingWrites } from "@/lib/flush";
import { openNavArea } from "@/lib/actions";
import {
  actionsOf,
  addAction,
  addDecision,
  addItem,
  decisionsOf,
  meetingNotesText,
  parseMeeting,
  setMeetingParts,
} from "@/lib/meeting";
import type { MeetingNote } from "@/lib/meetingList";
import { stepsFromAnswer, todayIso } from "@/lib/taskLogic";
import { useAiJobStore, type AiPicks } from "@/stores/aiJobStore";
import { useMeetingStore } from "@/stores/meetingStore";
import { useTaskStore } from "@/stores/taskStore";

/** The most of a meeting's notes the AI reads. */
const NOTES_CHARS = 10_000;

export const DECISIONS_INSTRUCTION =
  "Read the notes of a meeting below. Write a line DECISIONS, then the decisions that were made, one short line each starting with '- '. Then a line ACTIONS, then the things someone has to do, one short line each starting with '- ' and a verb (add who in a few words only if the notes say so). Leave out what is already listed under 'Decisions already there' and 'Actions already there'. Do not invent anything. If there is nothing, write NONE under the heading. Write in the language of the notes. Answer with the two lists only.";

export const AGENDA_INSTRUCTION =
  "Suggest the agenda of a meeting, from the meeting before it (its notes and the actions that are still open). Write each item as one short line that starts with '- ' (two to six words). At most six. Do not repeat the items already on the agenda, and do not invent facts. If there is nothing to suggest, answer exactly NONE. Write in the language of the notes.";

/** The answer "DECISIONS … ACTIONS …" as one list in two groups. */
export function parseDecisionsAndActions(answer: string): AiPicks {
  const decisions: string[] = [];
  const actions: string[] = [];
  let into: string[] | null = null;
  for (const raw of answer.split("\n")) {
    const line = raw.trim();
    if (/^[#*\s]*decisions?[*:\s]*$/i.test(line)) into = decisions;
    else if (/^[#*\s]*(actions?|to ?do)[*:\s]*$/i.test(line)) into = actions;
    else if (into !== null && !/^\s*NONE\b/i.test(line)) into.push(...stepsFromAnswer(line));
  }
  const items = [...decisions.slice(0, 8), ...actions.slice(0, 8)];
  const d = Math.min(decisions.length, 8);
  return {
    points: [],
    items,
    groups: [
      { title: "Decisions", from: 0, to: d },
      { title: "Actions", from: d, to: items.length },
    ],
  };
}

/** Shows the meeting in the Meetings area. */
function goToMeeting(path: string): void {
  openNavArea("meetings");
  useMeetingStore.getState().select(path);
}

/** Reads the meeting, changes it, writes it back, and has the lists read again. */
async function changeMeeting(path: string, fn: (content: string) => string): Promise<void> {
  await flushPendingWrites();
  const note = await api.readNote(path);
  await api.writeNote(path, fn(note.content));
  await useMeetingStore.getState().load();
  await useTaskStore.getState().load();
}

/**
 * "Decisions and actions from the notes": the AI reads the meeting's notes in the AI queue and
 * proposes decisions and actions. The ticked decisions are written under Decisions and the ticked
 * actions under Actions (as tasks). Nothing is written before.
 */
export function decisionsAndActions(m: MeetingNote): string {
  return useAiJobStore.getState().addPick({
    label: "Decisions and actions",
    where: m.meeting.title,
    instruction: DECISIONS_INSTRUCTION,
    read: async () => {
      const content = (await api.readNote(m.path)).content;
      const decided = decisionsOf(content);
      const actions = actionsOf(content).map((a) => a.text);
      return [
        `Notes:\n${meetingNotesText(content).slice(0, NOTES_CHARS)}`,
        `Decisions already there:\n${decided.map((d) => `- ${d}`).join("\n") || "none"}`,
        `Actions already there:\n${actions.map((a) => `- ${a}`).join("\n") || "none"}`,
      ].join("\n\n");
    },
    notePath: m.path,
    parse: parseDecisionsAndActions,
    noun: ["item", "items"],
    addTo: " to the meeting",
    add: async (chosen, picks) => {
      const decisions = new Set(
        picks.items.slice(picks.groups?.[0]?.from ?? 0, picks.groups?.[0]?.to ?? 0),
      );
      await changeMeeting(m.path, (content) => {
        const parts = parseMeeting(content).parts;
        let next = setMeetingParts(content, { ...parts, decisions: true, actions: true });
        for (const text of chosen) {
          next = decisions.has(text) ? addDecision(next, text) : addAction(next, text, todayIso());
        }
        return next;
      });
    },
    goTo: () => {
      goToMeeting(m.path);
    },
  });
}

/** The meeting before this one with the same name, if there is one. */
export function meetingBefore(m: MeetingNote, all: readonly MeetingNote[]): MeetingNote | null {
  const key = (x: MeetingNote): string => `${x.meeting.date ?? ""} ${x.meeting.time ?? ""}`;
  return (
    all
      .filter(
        (x) =>
          x.path !== m.path &&
          x.meeting.title.trim().toLowerCase() === m.meeting.title.trim().toLowerCase() &&
          key(x) < key(m),
      )
      .sort((a, b) => key(b).localeCompare(key(a)))[0] ?? null
  );
}

/**
 * "Suggest an agenda": from the meeting before it with the same name (its notes and the actions
 * still open), the AI proposes agenda items in the AI queue; the ticked ones are added to the
 * agenda (which is turned on when it was off).
 */
export function suggestAgenda(m: MeetingNote): string {
  const before = meetingBefore(m, useMeetingStore.getState().meetings);
  return useAiJobStore.getState().addPick({
    label: "Suggest an agenda",
    where: m.meeting.title,
    instruction: AGENDA_INSTRUCTION,
    read: async () => {
      const now = (await api.readNote(m.path)).content;
      const have = parseMeeting(now).agenda.map((a) => `- ${a.text}`);
      if (before === null) {
        return `This meeting: ${m.meeting.title}\nNo meeting before it with this name.\n\nOn the agenda already:\n${have.join("\n") || "none"}`;
      }
      const prev = (await api.readNote(before.path)).content;
      const open = actionsOf(prev)
        .filter((a) => !a.done)
        .map((a) => `- ${a.text}`);
      return [
        `This meeting: ${m.meeting.title}`,
        `The meeting before (${before.meeting.date ?? "no date"}), its notes:\n${meetingNotesText(prev).slice(0, NOTES_CHARS)}`,
        `Its actions that are still open:\n${open.join("\n") || "none"}`,
        `On the agenda already:\n${have.join("\n") || "none"}`,
      ].join("\n\n");
    },
    notePath: m.path,
    parse: (answer) => ({
      points: [],
      items: /^\s*NONE\b/i.test(answer) ? [] : stepsFromAnswer(answer),
    }),
    noun: ["item", "items"],
    addTo: " to the agenda",
    add: async (chosen) => {
      await changeMeeting(m.path, (content) => {
        const parts = parseMeeting(content).parts;
        let next = parts.agenda ? content : setMeetingParts(content, { ...parts, agenda: true });
        for (const text of chosen) next = addItem(next, text);
        return next;
      });
    },
    goTo: () => {
      goToMeeting(m.path);
    },
  });
}
