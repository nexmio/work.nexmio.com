import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  readNote: vi.fn(),
  writeNote: vi.fn(),
  taggedNotes: vi.fn(),
  listTasks: vi.fn(),
  listEpics: vi.fn(),
  aiInline: vi.fn(),
  aiCancel: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));
// The AI never answers here: the job waits in the queue, and its spec is tested directly.
vi.mock("@/lib/wake", () => ({ wakeIfNeeded: () => new Promise(() => undefined) }));

import type { MeetingNote } from "@/lib/meetingList";
import { useAiJobStore } from "@/stores/aiJobStore";
import { useMeetingStore } from "@/stores/meetingStore";
import { useTaskStore } from "@/stores/taskStore";
import {
  decisionsAndActions,
  meetingBefore,
  parseDecisionsAndActions,
  suggestAgenda,
} from "./meetingAi";

const PAGE = [
  "---",
  "tags: [meeting]",
  "meeting: 2026-11-19 10:00",
  "parts: [agenda]",
  "---",
  "# Weekly",
  "",
  "## Agenda",
  "",
  "- [ ] Budget",
  "",
  "## Notes",
  "",
  "We pick the blue van. Lene books it.",
  "",
].join("\n");

const note = (path: string, date: string): MeetingNote =>
  ({ path, meeting: { title: "Weekly", date, time: "10:00" } }) as unknown as MeetingNote;

function job() {
  const j = useAiJobStore.getState().jobs[0];
  if (j?.kind !== "pick") throw new Error("no pick job");
  return j;
}

describe("the AI of a meeting", () => {
  let page = PAGE;
  beforeEach(() => {
    page = PAGE;
    useAiJobStore.setState({ jobs: [] });
    apiMock.readNote
      .mockReset()
      .mockImplementation(() => Promise.resolve({ path: "M.md", content: page }));
    apiMock.writeNote.mockReset().mockImplementation((_p: string, c: string) => {
      page = c;
      return Promise.resolve();
    });
    useMeetingStore.setState({ load: () => Promise.resolve(), meetings: [] } as never);
    useTaskStore.setState({ load: () => Promise.resolve() } as never);
  });

  it("reads decisions and actions in two groups", () => {
    const picks = parseDecisionsAndActions(
      "DECISIONS\n- Blue van\nACTIONS\n- Book the van (Lene)\n- Pack the boxes",
    );
    expect(picks.items).toEqual(["Blue van", "Book the van (Lene)", "Pack the boxes"]);
    expect(picks.groups).toEqual([
      { title: "Decisions", from: 0, to: 1 },
      { title: "Actions", from: 1, to: 3 },
    ]);
    expect(parseDecisionsAndActions("DECISIONS\nNONE\nACTIONS\nNONE").items).toEqual([]);
  });

  it("writes the ticked decisions under Decisions and the actions as tasks, turning the parts on", async () => {
    decisionsAndActions(note("M.md", "2026-11-19"));
    expect(await job().spec.read()).toContain("We pick the blue van.");
    const picks = job().spec.parse("DECISIONS\n- Blue van\nACTIONS\n- Book the van");
    await job().spec.add(["Blue van", "Book the van"], picks);
    expect(page).toMatch(/parts: \[agenda, decisions, actions\]/);
    expect(page).toMatch(/## Decisions\n+- Blue van/);
    expect(page).toMatch(/## Actions\n+- \[ \] Book the van made:\d{4}-\d{2}-\d{2}/);
  });

  it("suggests an agenda from the meeting before with the same name, and adds the ticked items", async () => {
    const before = note("Old.md", "2026-11-12");
    const now = note("M.md", "2026-11-19");
    expect(meetingBefore(now, [before, now, note("Later.md", "2026-11-26")])).toBe(before);
    useMeetingStore.setState({ meetings: [before, now] } as never);
    suggestAgenda(now);
    const text = await job().spec.read();
    expect(text).toContain("The meeting before (2026-11-12)");
    expect(text).toContain("- Budget");
    await job().spec.add(["Van keys"], { points: [], items: ["Van keys"] });
    expect(page).toMatch(/- \[ \] Budget\n- \[ \] Van keys/);
  });
});
