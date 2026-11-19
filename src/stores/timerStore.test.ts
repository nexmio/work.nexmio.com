import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { useTaskStore } from "./taskStore";
import { useTimerStore } from "./timerStore";
import { useUiStore } from "./uiStore";

const task = makeTask({ path: "Tasks/Acme.md", line: 4, key: "k", title: "Call Anna" });

describe("the timer", () => {
  const addLog = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 18, 9, 0, 0));
    addLog.mockClear();
    useTaskStore.setState({ tasks: [task], addLog });
    useTimerStore.setState({ running: null });
    useUiStore.setState({ rightTab: "outline" });
  });

  it("starts on a task, shows the Timer tab and is remembered on this computer", async () => {
    await useTimerStore.getState().start(task);
    const r = useTimerStore.getState().running;
    expect(r).toMatchObject({ path: "Tasks/Acme.md", title: "Call Anna" });
    expect(useUiStore.getState().rightTab).toBe("timer");
    useTimerStore.setState({ running: null });
    useTimerStore.getState().restore();
    expect(useTimerStore.getState().running?.title).toBe("Call Anna");
  });

  it("stops and writes one line in the task's log with the time and the note", async () => {
    await useTimerStore.getState().start(task);
    vi.setSystemTime(new Date(2026, 10, 18, 10, 20, 0));
    const ok = await useTimerStore.getState().stop("Asked about the key");
    expect(ok).toBe(true);
    expect(addLog).toHaveBeenCalledWith(task, "⏱ 1 h 20 min · 09:00–10:20 · Asked about the key");
    expect(useTimerStore.getState().running).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("a timer that ran for seconds is written as one minute", async () => {
    await useTimerStore.getState().start(task);
    vi.setSystemTime(new Date(2026, 10, 18, 9, 0, 10));
    await useTimerStore.getState().stop();
    expect(addLog.mock.calls[0]?.[1]).toBe("⏱ 1 min · 09:00–09:00");
  });

  it("starting another timer stops the first and writes its time", async () => {
    const other = makeTask({ path: "Tasks/Acme.md", line: 9, key: "o", title: "Send the invoice" });
    useTaskStore.setState({ tasks: [task, other], addLog });
    await useTimerStore.getState().start(task);
    vi.setSystemTime(new Date(2026, 10, 18, 9, 30, 0));
    await useTimerStore.getState().start(other);
    expect(addLog).toHaveBeenCalledTimes(1);
    expect(addLog.mock.calls[0]?.[1]).toContain("30 min");
    expect(useTimerStore.getState().running?.title).toBe("Send the invoice");
  });

  it("says so when the task is gone, and writes nothing", async () => {
    await useTimerStore.getState().start(task);
    useTaskStore.setState({ tasks: [] });
    expect(await useTimerStore.getState().stop()).toBe(false);
    expect(addLog).not.toHaveBeenCalled();
    expect(useTimerStore.getState().running).toBeNull();
  });

  it("makes a task in the epic and starts the timer on it", async () => {
    const add = vi
      .fn()
      .mockImplementation((text: string, _n: unknown, _s: unknown, path: string) => {
        useTaskStore.setState({
          tasks: [
            ...useTaskStore.getState().tasks,
            makeTask({ path, line: 12, key: "n", title: text }),
          ],
        });
        return Promise.resolve();
      });
    useTaskStore.setState({ add });
    const ok = await useTimerStore
      .getState()
      .startNew({ title: "  Review   the contract ", epicPath: "Tasks/Acme.md" });
    expect(ok).toBe(true);
    expect(add).toHaveBeenCalledWith("Review the contract", undefined, undefined, "Tasks/Acme.md");
    expect(useTimerStore.getState().running).toMatchObject({
      title: "Review the contract",
      line: 12,
    });
  });
});
