import { describe, expect, it } from "vitest";
import type { Project } from "@/bindings/Project";
import type { EpicGroup } from "@/lib/taskLogic";
import { byProject } from "./byProject";

const g = (path: string): EpicGroup => ({ path, title: path }) as EpicGroup;
const p = (name: string, folder: string): Project => ({ id: folder, name, folder }) as Project;

describe("byProject", () => {
  it("puts the epics of a project under its name, and the rest last as other epics", () => {
    const out = byProject(
      [
        g("Office/Epics/Move.md"),
        g("Tasks/Support.md"),
        g("VPN/Epics/Rollout.md"),
        g("Office/Epics/IT.md"),
      ],
      [p("Office move", "Office"), p("VPN rollout", "VPN")],
    );
    expect(out.map((s) => [s.name, s.groups.map((x) => x.path), s.others])).toEqual([
      ["Office move", ["Office/Epics/Move.md", "Office/Epics/IT.md"], false],
      ["VPN rollout", ["VPN/Epics/Rollout.md"], false],
      [null, ["Tasks/Support.md"], true],
    ]);
  });

  it("is one section with no heading when no epic is in a project", () => {
    const out = byProject([g("Tasks/A.md"), g("Tasks/B.md")], [p("Office move", "Office")]);
    expect(out).toHaveLength(1);
    expect(out[0]?.others).toBe(false);
  });
});
