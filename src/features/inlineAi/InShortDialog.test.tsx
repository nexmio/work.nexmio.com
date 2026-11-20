import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  readNote: vi.fn(),
  taskAddToNote: vi.fn(),
  epicForNote: vi.fn(),
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

import { useAiJobStore } from "@/stores/aiJobStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { makeTask } from "@/test/taskFixtures";
import { InShortDialog } from "./InShortDialog";

function job() {
  const j = useAiJobStore.getState().jobs[0];
  if (j?.kind !== "pick") throw new Error("no pick job");
  return j;
}

describe("In short", () => {
  beforeEach(() => {
    useAiJobStore.setState({ jobs: [] });
    apiMock.readNote.mockReset().mockResolvedValue({
      path: "Meetings/Acme.md",
      content: "We agreed on the price. Peter sends the quote.",
    });
    apiMock.taskAddToNote.mockReset().mockResolvedValue([makeTask()]);
    apiMock.epicForNote
      .mockReset()
      .mockResolvedValue({ path: "Tasks/Acme.md", title: "Acme", source: "Meetings/Acme" });
    apiMock.listTasks.mockReset().mockResolvedValue([]);
    apiMock.listEpics.mockReset().mockResolvedValue([]);
    useVaultStore.setState({ activePath: "Meetings/Acme.md" });
    useUiStore.setState({ inShortOpen: true });
  });

  it("goes into the AI queue at once, and reads the points and the things to do", async () => {
    render(<InShortDialog />);
    await vi.waitFor(() => {
      expect(useAiJobStore.getState().jobs).toHaveLength(1);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(useUiStore.getState().inShortOpen).toBe(false);
    const j = job();
    expect(await j.spec.read()).toContain("We agreed on the price.");
    const picks = j.spec.parse("POINTS\n- The price is agreed\nTODO\n- Send the quote");
    expect(picks).toEqual({ points: ["The price is agreed"], items: ["Send the quote"] });
    expect(j.spec.copy?.(picks)).toContain("- [ ] Send the quote");
  });

  it("adds only the ticked things to do to the epic of the page", async () => {
    render(<InShortDialog />);
    await vi.waitFor(() => {
      expect(useAiJobStore.getState().jobs).toHaveLength(1);
    });
    await job().spec.add(["Send the quote"], { points: [], items: [] });
    expect(apiMock.taskAddToNote.mock.calls[0]?.[0]).toBe("Tasks/Acme.md");
    expect(apiMock.taskAddToNote.mock.calls[0]?.[1]).toEqual(["Send the quote"]);
  });
});
