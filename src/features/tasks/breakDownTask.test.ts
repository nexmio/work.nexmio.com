import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";

const apiMock = vi.hoisted(() => ({ taskAddStep: vi.fn(), readNote: vi.fn() }));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));
// The AI never answers here: the job waits in the queue, and its spec is tested directly.
vi.mock("@/lib/wake", () => ({ wakeIfNeeded: () => new Promise(() => undefined) }));

import { useAiJobStore } from "@/stores/aiJobStore";
import { useTaskStore } from "@/stores/taskStore";
import { breakDownTask } from "./breakDownTask";

const task = makeTask({ title: "Document access control", path: "Tasks/Security.md" });

function job() {
  const j = useAiJobStore.getState().jobs[0];
  if (j?.kind !== "pick") throw new Error("no pick job");
  return j;
}

describe("breaking a task down", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAiJobStore.setState({ jobs: [] });
    apiMock.taskAddStep.mockResolvedValue([task]);
    apiMock.readNote.mockResolvedValue({ path: task.path, content: "# Security\n\nISO 27001." });
    useTaskStore.setState({ tasks: [task] });
  });

  it("goes into the AI queue, which is shown, with the page the task is in to read", async () => {
    breakDownTask(task);
    const j = job();
    expect(j.label).toBe("Break it down: Document access control");
    expect(j.spec.firstIsStart).toBe(true);
    expect(j.spec.other?.label).toBe("Make the steps smaller");
    expect(j.spec.other?.instruction).toMatch(/VERY small/);
    const text = await j.spec.read();
    expect(text).toContain("Task: Document access control");
    expect(text).toContain("ISO 27001.");
  });

  it("writes only the ticked steps, in order, under the task", async () => {
    breakDownTask(task);
    const j = job();
    expect(j.spec.parse("- List who has access\n- Write the rules").items).toEqual([
      "List who has access",
      "Write the rules",
    ]);
    await j.spec.add(["List who has access", "Write the rules"], { points: [], items: [] });
    expect(apiMock.taskAddStep.mock.calls.map((c: unknown[]) => c[3] as string)).toEqual([
      "List who has access",
      "Write the rules",
    ]);
  });

  it("goes back to the task", () => {
    const open = vi.fn();
    useTaskStore.setState({ open });
    breakDownTask(task);
    useAiJobStore.getState().goTo(job().id);
    expect(open).toHaveBeenCalledWith(task);
  });
});
