import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/bindings/Project";
import { epicTrail } from "./epicTrail";

const project: Project = {
  schemaVersion: 1,
  id: "p",
  name: "Office move",
  folder: "Office move",
  instructions: "",
  providerId: null,
  localOnly: false,
  createdAt: "",
  updatedAt: "",
};

describe("epicTrail", () => {
  it("goes project, the page the epic was made from, then the epic", () => {
    const goProject = vi.fn();
    const steps = epicTrail({
      epicPath: "Office move/Epics/Neighbours.md",
      epicTitle: "Tell the neighbours",
      from: "Office move/Office move plan.md",
      projects: [project],
      goProject,
      goPage: vi.fn(),
    });
    expect(steps.map((s) => s.label)).toEqual([
      "Office move",
      "Office move plan",
      "Tell the neighbours",
    ]);
    steps[0]?.run?.();
    expect(goProject).toHaveBeenCalledWith("Office move");
    expect(steps[2]?.run).toBeUndefined();
  });

  it("has no trail for an epic in no project that was made from nothing", () => {
    const steps = epicTrail({
      epicPath: "Tasks/Loose.md",
      epicTitle: "Loose",
      from: null,
      projects: [project],
      goProject: vi.fn(),
      goPage: vi.fn(),
    });
    expect(steps).toEqual([]);
  });
});
