import { describe, expect, it } from "vitest";
import { LinkResolver } from "@/lib/links";
import { parsePlan } from "@/lib/planTree";
import { migrations } from "./migrate";

const PLAN = "Move/Move.md";

function run(list: string, files: string[], keep: string[] = []) {
  const all = [PLAN, ...files];
  const resolver = new LinkResolver(all);
  return migrations({
    planPath: PLAN,
    project: "Move",
    nodes: parsePlan(`# Move\n\n${list}\n`).nodes,
    files: all,
    folders: [],
    resolve: (t) => resolver.resolve(t),
    keep: new Set(keep),
  });
}

describe("moving to the folder structure", () => {
  it("puts each page in the folder of the parts above, named after its part", () => {
    expect(
      run("- test [[Move/test]]\n  - dummy [[Move/Notes/dummy]]", [
        "Move/test.md",
        "Move/Notes/dummy.md",
      ]),
    ).toEqual([
      { from: "Move/test.md", to: "Move/Pages/test_page.md", ticked: true },
      { from: "Move/Notes/dummy.md", to: "Move/Pages/test/dummy_page.md", ticked: true },
    ]);
  });

  it("leaves a page that is in place, also a numbered one", () => {
    expect(
      run("- test [[Move/Pages/test_page]] [[Move/Pages/test_page 2]]", [
        "Move/Pages/test_page.md",
        "Move/Pages/test_page 2.md",
      ]),
    ).toEqual([]);
  });

  it("numbers pages of one part, and never takes a name that is there", () => {
    const found = run("- test [[Move/a]] [[Move/b]]", [
      "Move/a.md",
      "Move/b.md",
      "Move/Pages/Test_page.md",
    ]);
    expect(found.map((m) => m.to)).toEqual([
      "Move/Pages/test_page 2.md",
      "Move/Pages/test_page 3.md",
    ]);
  });

  it("does not tick a page in a folder that was chosen", () => {
    expect(run("- Network [[Move/Contracts/Offer]]", ["Move/Contracts/Offer.md"])).toEqual([
      { from: "Move/Contracts/Offer.md", to: "Move/Pages/Network_page.md", ticked: false },
    ]);
  });

  it("takes a page with the first part that links it", () => {
    const found = run("- one [[Move/a]]\n- two [[Move/a]]", ["Move/a.md"]);
    expect(found.map((m) => m.to)).toEqual(["Move/Pages/one_page.md"]);
  });

  it("leaves epics, meetings, the plan, tasks, missing pages and pages outside alone", () => {
    expect(
      run(
        "- one [[Move/Move]] [[Move/Epics/Move]] [[Move/Kick-off]] [[Move/x#Call]] [[Gone]] [[Work/Out]]",
        ["Move/Epics/Move.md", "Move/Kick-off.md", "Move/x.md", "Work/Out.md"],
        ["Move/Epics/Move.md", "Move/Kick-off.md"],
      ),
    ).toEqual([]);
  });
});
