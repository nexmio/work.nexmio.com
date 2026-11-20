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

import { FindTasksDialog } from "./FindTasksDialog";
import { useAiJobStore } from "@/stores/aiJobStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { makeTask } from "@/test/taskFixtures";

function job() {
  const j = useAiJobStore.getState().jobs[0];
  if (j?.kind !== "pick") throw new Error("no pick job");
  return j;
}

describe("Find tasks", () => {
  beforeEach(() => {
    useAiJobStore.setState({ jobs: [] });
    apiMock.readNote.mockReset().mockResolvedValue({
      path: "Møder/Acme.md",
      content: "Peter sends the quote by friday.",
      mtime: 0,
    });
    apiMock.taskAddToNote.mockReset().mockResolvedValue([makeTask()]);
    apiMock.epicForNote
      .mockReset()
      .mockResolvedValue({ path: "Tasks/Acme.md", title: "Acme", source: "Møder/Acme" });
    apiMock.listTasks.mockReset().mockResolvedValue([]);
    apiMock.listEpics.mockReset().mockResolvedValue([]);
    useVaultStore.setState({ activePath: "Møder/Acme.md" });
    useUiStore.setState({
      findTasksOpen: true,
      findTasksIn: null,
      findTasksOpts: { path: null, mode: "tasks" },
    });
  });

  it("puts the job in the AI queue at once, with no window that waits", async () => {
    render(<FindTasksDialog />);
    await vi.waitFor(() => {
      expect(useAiJobStore.getState().jobs).toHaveLength(1);
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(useUiStore.getState().findTasksOpen).toBe(false);
    expect(job()).toMatchObject({ label: "Find tasks in this page" });
    expect(await job().spec.read()).toBe("Peter sends the quote by friday.");
  });

  it("adds only the kept tasks to the epic of that page, and reads NONE as nothing", async () => {
    render(<FindTasksDialog />);
    await vi.waitFor(() => {
      expect(useAiJobStore.getState().jobs).toHaveLength(1);
    });
    expect(job().spec.parse("NONE").items).toEqual([]);
    expect(job().spec.parse("- Send the quote fri\n- Ask Lene").items).toHaveLength(2);
    await job().spec.add(["Send the quote fri"], { points: [], items: [] });
    const [path, texts] = apiMock.taskAddToNote.mock.calls[0] as [string, string[]];
    expect(path).toBe("Tasks/Acme.md");
    expect(apiMock.epicForNote).toHaveBeenCalledWith("Møder/Acme.md");
    // What the AI found is the title: no date is read from it.
    expect(texts).toEqual(["Send the quote fri"]);
  });

  it("asks nothing without an open page", () => {
    useVaultStore.setState({ activePath: null });
    render(<FindTasksDialog />);
    expect(useAiJobStore.getState().jobs).toHaveLength(0);
  });
});
