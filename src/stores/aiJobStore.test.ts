import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatEvent } from "@/bindings/ChatEvent";

const apiMock = vi.hoisted(() => ({
  aiInline: vi.fn(),
  aiCancel: vi.fn(),
  readNote: vi.fn(),
  writeNote: vi.fn(),
  commitNow: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/wake", () => ({ wakeIfNeeded: () => Promise.resolve(null) }));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));

import { findSpot, useAiJobStore, type AiJobSpec, type AiPickSpec } from "./aiJobStore";
import { useUiStore } from "./uiStore";
import { useVaultStore } from "./vaultStore";

const pickSpec = (over: Partial<AiPickSpec> = {}): AiPickSpec => ({
  label: "Suggest parts",
  where: "Move the office",
  instruction: "Suggest parts",
  read: () => Promise.resolve("parts-text"),
  notePath: "Plans/Move.md",
  parse: (a) => ({ points: [], items: a.split("\n").map((l) => l.replace(/^- /, "")) }),
  noun: ["part", "parts"],
  addTo: " to the plan",
  add: vi.fn().mockResolvedValue(undefined),
  ...over,
});

const spec = (label: string, text = "Hello wrold"): AiJobSpec => ({
  label,
  command: "fixSpelling",
  instruction: null,
  answer: false,
  diagram: false,
  text,
  notePath: "a.md",
  from: 4,
  to: 4 + text.length,
});

/** Each run waits until `finish(label)` is called. */
const pending = new Map<string, (e: ChatEvent) => void>();

describe("the AI queue", () => {
  beforeEach(() => {
    pending.clear();
    useAiJobStore.setState({ jobs: [], tab: "chat" });
    apiMock.aiInline.mockReset();
    apiMock.aiCancel.mockResolvedValue(undefined);
    apiMock.commitNow.mockResolvedValue(undefined);
    apiMock.writeNote.mockResolvedValue(undefined);
    apiMock.aiInline.mockImplementation((req: { text: string }, on: (e: ChatEvent) => void) => {
      pending.set(req.text, on);
      return Promise.resolve(`task-${req.text}`);
    });
  });

  const settle = () => new Promise((r) => setTimeout(r, 0));

  it("runs one job at a time, in the order they were added", async () => {
    const s = useAiJobStore.getState();
    s.add(spec("First", "one"));
    s.add(spec("Second", "two"));
    await settle();
    const status = () => useAiJobStore.getState().jobs.map((j) => j.status);
    expect(status()).toEqual(["running", "queued"]);
    expect(apiMock.aiInline).toHaveBeenCalledTimes(1);
    pending.get("one")?.({ type: "textDelta", text: "One." });
    pending.get("one")?.({ type: "done" });
    await settle();
    expect(status()).toEqual(["ready", "running"]);
    expect(useAiJobStore.getState().jobs[0]).toMatchObject({ result: "One." });
    expect(apiMock.aiInline).toHaveBeenCalledTimes(2);
  });

  it("stops a job that runs when it is taken out, and goes on with the next", async () => {
    const s = useAiJobStore.getState();
    const first = s.add(spec("First", "one"));
    s.add(spec("Second", "two"));
    await settle();
    useAiJobStore.getState().remove(first);
    await settle();
    expect(apiMock.aiCancel).toHaveBeenCalledWith("task-one");
    expect(useAiJobStore.getState().jobs.map((j) => j.label)).toEqual(["Second"]);
    expect(apiMock.aiInline).toHaveBeenCalledTimes(2);
  });

  it("a failed job does not hold the queue", async () => {
    const s = useAiJobStore.getState();
    s.add(spec("First", "one"));
    s.add(spec("Second", "two"));
    await settle();
    pending.get("one")?.({ type: "error", error: { code: "Ai", message: "No answer" } } as never);
    await settle();
    const jobs = useAiJobStore.getState().jobs;
    expect(jobs[0]).toMatchObject({ status: "failed", error: "No answer" });
    expect(jobs[1]?.status).toBe("running");
  });

  it("writes an accepted result in the page, where the text is, and takes the job out", async () => {
    useVaultStore.setState({ activePath: "a.md" });
    apiMock.readNote.mockResolvedValue({ path: "a.md", content: "Say Hello wrold now" });
    const id = useAiJobStore.getState().add(spec("Fix"));
    await settle();
    pending.get("Hello wrold")?.({ type: "textDelta", text: "Hello world" });
    pending.get("Hello wrold")?.({ type: "done" });
    await settle();
    await useAiJobStore.getState().accept(id);
    expect(apiMock.writeNote).toHaveBeenCalledWith("a.md", "Say Hello world now");
    expect(apiMock.commitNow).toHaveBeenCalledTimes(2);
    expect(useAiJobStore.getState().jobs).toHaveLength(0);
  });

  it("does not write when the text has changed", async () => {
    apiMock.readNote.mockResolvedValue({ path: "a.md", content: "Something else" });
    const id = useAiJobStore.getState().add(spec("Fix"));
    await settle();
    pending.get("Hello wrold")?.({ type: "textDelta", text: "Hello world" });
    pending.get("Hello wrold")?.({ type: "done" });
    await settle();
    await useAiJobStore.getState().accept(id);
    expect(apiMock.writeNote).not.toHaveBeenCalled();
    expect(useAiJobStore.getState().jobs).toHaveLength(1);
  });
});

describe("jobs with a list to tick", () => {
  beforeEach(() => {
    pending.clear();
    useAiJobStore.setState({ jobs: [], tab: "chat" });
    useUiStore.setState({ askOpen: false, rightTab: "outline", rightCollapsed: true });
    apiMock.aiInline.mockReset();
    apiMock.aiCancel.mockResolvedValue(undefined);
    apiMock.aiInline.mockImplementation((req: { text: string }, on: (e: ChatEvent) => void) => {
      pending.set(req.text, on);
      return Promise.resolve(`task-${req.text}`);
    });
  });
  const settle = () => new Promise((r) => setTimeout(r, 0));

  it("shows the queue when a job is added, so it is seen without looking for it", () => {
    useAiJobStore.getState().addPick(pickSpec());
    expect(useAiJobStore.getState().tab).toBe("tasks");
    expect(useUiStore.getState().askOpen).toBe(true);
  });

  it("reads its text when it starts, and makes the list from the answer", async () => {
    const id = useAiJobStore.getState().addPick(pickSpec());
    await settle();
    expect(apiMock.aiInline.mock.calls[0]?.[0]).toMatchObject({
      command: "custom",
      instruction: "Suggest parts",
      text: "parts-text",
      notePath: "Plans/Move.md",
    });
    pending.get("parts-text")?.({ type: "textDelta", text: "- Disks\n- Backup" });
    pending.get("parts-text")?.({ type: "done" });
    await settle();
    expect(useAiJobStore.getState().jobs[0]).toMatchObject({
      id,
      status: "ready",
      picks: { points: [], items: ["Disks", "Backup"] },
    });
  });

  it("asks again, with another instruction when given", async () => {
    const id = useAiJobStore.getState().addPick(pickSpec());
    await settle();
    pending.get("parts-text")?.({ type: "done" });
    await settle();
    useAiJobStore.getState().again(id, "Smaller");
    await settle();
    expect(apiMock.aiInline).toHaveBeenCalledTimes(2);
    expect(apiMock.aiInline.mock.calls[1]?.[0]).toMatchObject({ instruction: "Smaller" });
  });

  it("gives only the ticked items to the job and takes it out; nothing before", async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const id = useAiJobStore.getState().addPick(pickSpec({ add }));
    await useAiJobStore.getState().acceptPicks(id, ["Disks"]);
    expect(add).not.toHaveBeenCalled();
    await settle();
    pending.get("parts-text")?.({ type: "textDelta", text: "- Disks\n- Backup" });
    pending.get("parts-text")?.({ type: "done" });
    await settle();
    await useAiJobStore.getState().acceptPicks(id, ["Disks"]);
    expect(add).toHaveBeenCalledWith(
      ["Disks"],
      expect.objectContaining({ items: ["Disks", "Backup"] }),
    );
    expect(useAiJobStore.getState().jobs).toHaveLength(0);
  });

  it("goes back to where it was asked", () => {
    const goTo = vi.fn();
    const id = useAiJobStore.getState().addPick(pickSpec({ goTo }));
    useAiJobStore.getState().goTo(id);
    expect(goTo).toHaveBeenCalled();
    const openNote = vi.fn().mockResolvedValue(undefined);
    useVaultStore.setState({ openNote });
    const edit = useAiJobStore.getState().add(spec("Fix"));
    useAiJobStore.getState().goTo(edit);
    expect(openNote).toHaveBeenCalledWith("a.md");
  });
});

describe("findSpot", () => {
  it("uses the place it was, else the only other place, else nothing", () => {
    expect(findSpot("ab cd", "cd", 3, 5)).toEqual({ from: 3, to: 5 });
    expect(findSpot("xx cd", "cd", 0, 2)).toEqual({ from: 3, to: 5 });
    expect(findSpot("cd cd", "cd", 1, 3)).toBeNull();
    expect(findSpot("nothing", "cd", 0, 2)).toBeNull();
  });
});
