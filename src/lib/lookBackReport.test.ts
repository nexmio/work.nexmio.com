import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  changedPages: vi.fn(),
  createNote: vi.fn(),
  writeNote: vi.fn(),
  aiInline: vi.fn(),
  aiCancel: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
// The AI never answers here: the job waits in the queue, and its spec is tested directly.
vi.mock("@/lib/wake", () => ({ wakeIfNeeded: () => new Promise(() => undefined) }));

import type { Project } from "@/bindings/Project";
import { todayIso } from "@/lib/taskLogic";
import { useAiJobStore } from "@/stores/aiJobStore";
import { useMeetingStore } from "@/stores/meetingStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTaskStore } from "@/stores/taskStore";
import { useVaultStore } from "@/stores/vaultStore";
import { makeTask } from "@/test/taskFixtures";
import { reportParagraphs, writeReport } from "./lookBackReport";

const secret: Project = {
  schemaVersion: 1,
  id: "s",
  name: "Secret",
  folder: "Secret",
  instructions: "",
  providerId: null,
  localOnly: true,
  createdAt: "",
  updatedAt: "",
};

function job() {
  const j = useAiJobStore.getState().jobs[0];
  if (j?.kind !== "pick") throw new Error("no pick job");
  return j;
}

describe("the status report", () => {
  beforeEach(() => {
    useAiJobStore.setState({ jobs: [] });
    apiMock.changedPages.mockReset().mockResolvedValue([]);
    apiMock.createNote.mockReset().mockResolvedValue("Inbox/Status week 47.md");
    apiMock.writeNote.mockReset().mockResolvedValue(undefined);
    const done = (path: string, title: string) =>
      makeTask({ path, title, done: true, history: [{ date: todayIso(), text: "Done" }] });
    useTaskStore.setState({
      loaded: true,
      tasks: [done("Work/T.md", "Send the quote"), done("Secret/T.md", "Hidden thing")],
      epics: [],
    });
    useMeetingStore.setState({ loaded: true, meetings: [] });
    useVaultStore.setState({
      projects: [secret],
      refreshTree: () => Promise.resolve(),
      openNote: () => Promise.resolve(),
      vault: { config: { quickNotesFolder: "Inbox" } },
    } as never);
  });

  it("gives the AI only the list, and leaves a Local AI only project out when a cloud AI is on", async () => {
    useSettingsStore.setState({ settings: { ai: { cloudConsent: { providerId: "c" } } } } as never);
    writeReport(0, null);
    const text = await job().spec.read();
    expect(text).toContain("- Send the quote");
    expect(text).not.toContain("Hidden thing");
    expect(job().spec.notePath).toBeNull();
  });

  it("keeps everything without a cloud AI, and a chosen project's own rules apply", async () => {
    useSettingsStore.setState({ settings: { ai: { cloudConsent: null } } } as never);
    writeReport(0, null);
    expect(await job().spec.read()).toContain("Hidden thing");
    useAiJobStore.setState({ jobs: [] });
    writeReport(0, secret);
    expect(job().spec.notePath).toBe("Secret/Status.md");
  });

  it("reads the answer as paragraphs, and saves it as a page only when asked", async () => {
    writeReport(0, null);
    const picks = reportParagraphs("The van is booked.\nKeys wait.\n\nNext week we move.");
    expect(picks.points).toEqual(["The van is booked. Keys wait.", "Next week we move."]);
    expect(apiMock.writeNote).not.toHaveBeenCalled();
    await job().spec.text?.save?.run(picks);
    expect(apiMock.createNote).toHaveBeenCalledWith(
      "Inbox",
      expect.stringMatching(/^Status week \d+$/),
    );
    expect(apiMock.writeNote.mock.calls[0]?.[1]).toContain("Next week we move.");
  });
});
