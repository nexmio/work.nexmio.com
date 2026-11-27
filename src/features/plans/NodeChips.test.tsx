import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkResolver } from "@/lib/links";
import { makeTask } from "@/test/taskFixtures";
import { NodeChips } from "./NodeChips";
import { infoFor, type InfoContext } from "./nodeInfo";

const files = ["Move/Pages/a_page.md", "Work/Offer.md"];
const ctx: InfoContext = {
  resolver: new LinkResolver(files),
  groups: [],
  planEpic: "Tasks/Move.md",
  tasks: [
    makeTask({ path: "Tasks/Move.md", title: "Pack" }),
    makeTask({ path: "Tasks/Other.md", title: "Call" }),
    makeTask({ path: "Move/Epics/Sub.md", title: "Lift" }),
  ],
  projectFolder: "Move",
};

const show = (text: string, over: Partial<InfoContext> = {}) =>
  render(<NodeChips info={infoFor({ text, children: [] }, { ...ctx, ...over })} compact />);

const icon = (title: RegExp): string => {
  const classes = screen.getByTitle(title).querySelector("svg")?.getAttribute("class") ?? "";
  if (classes.includes("lucide-house")) return "house";
  return classes.includes("lucide-arrow-up-right") ? "arrow" : "none";
};

describe("where a linked thing is, on a part's chips", () => {
  it("shows a house for a page in the project and an arrow for one outside", () => {
    show("Servers [[Move/Pages/a_page]] [[Work/Offer]]");
    expect(icon(/In this project: Move\/Pages\/a_page\.md/)).toBe("house");
    expect(icon(/Outside this project: Work\/Offer\.md/)).toBe("arrow");
  });

  it.each([
    ["Pack [[Tasks/Move#Pack]]", "house"],
    ["Lift [[Move/Epics/Sub#Lift]]", "house"],
    ["Call [[Tasks/Other#Call]]", "arrow"],
  ])("marks the task of %s with the %s", (text, expected) => {
    show(text, {
      resolver: new LinkResolver(["Tasks/Move.md", "Tasks/Other.md", "Move/Epics/Sub.md"]),
    });
    expect(icon(/Open the task/)).toBe(expected);
  });

  it("shows no mark for a plan in no project", () => {
    show("Servers [[Work/Offer]]", { projectFolder: null });
    expect(icon(/Open the page Work\/Offer\.md/)).toBe("none");
    expect(screen.getByTitle("Open the page Work/Offer.md")).toBeInTheDocument();
  });
});
