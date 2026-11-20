import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  readNote: vi.fn(),
  writeNote: vi.fn(),
  aiInline: vi.fn(),
  aiCancel: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));
// The AI never answers here: the job stays in the queue, and its spec is tested directly.
vi.mock("@/lib/wake", () => ({ wakeIfNeeded: () => new Promise(() => undefined) }));

import { LinkResolver } from "@/lib/links";
import { makeTask } from "@/test/taskFixtures";
import { parsePlan } from "@/lib/planTree";
import { useAiJobStore, type PickJob } from "@/stores/aiJobStore";
import { usePlanStore } from "@/stores/planStore";
import { useTaskStore } from "@/stores/taskStore";
import { useVaultStore } from "@/stores/vaultStore";
import { outlineFor, pathOf, suggestParts, trailOf } from "./suggestParts";

const PATH = "Projects/Office/Move the office.md";
const PAGE = `---
tags: [plan]
---
# Move the office

We move to the new office in March.

- Server [[Projects/Office/Notes/Server]]
  > Only the physical ones
  - Disks
- Network
  - Wi-Fi
`;

function onlyJob(): PickJob {
  const job = useAiJobStore.getState().jobs[0];
  if (job?.kind !== "pick") throw new Error("no pick job");
  return job;
}

describe("suggesting parts", () => {
  let page = PAGE;
  beforeEach(() => {
    page = PAGE;
    vi.clearAllMocks();
    useAiJobStore.setState({ jobs: [] });
    apiMock.readNote.mockImplementation((p: string) =>
      Promise.resolve({
        path: p,
        content: p === PATH ? page : "# Server\n\nTwo racks in the basement.",
      }),
    );
    apiMock.writeNote.mockImplementation((_p: string, text: string) => {
      page = text;
      return Promise.resolve();
    });
    useVaultStore.setState({
      files: [PATH, "Projects/Office/Notes/Server.md"],
      resolver: new LinkResolver([PATH, "Projects/Office/Notes/Server.md"]),
    });
    useTaskStore.setState({
      epics: [
        {
          path: "Projects/Office/Epics/Move the office.md",
          title: "Move the office",
          source: "Projects/Office/Move the office",
          description: "",
          tags: [],
        },
      ],
      tasks: [
        makeTask({ path: "Projects/Office/Epics/Move the office.md", title: "Order new racks" }),
      ],
    });
    usePlanStore.setState({
      path: PATH,
      title: "Move the office",
      nodes: parsePlan(PAGE).nodes,
    });
  });

  it("finds a part again by its words, and marks it in the outline of the whole plan", () => {
    const nodes = parsePlan(PAGE).nodes;
    expect(trailOf(nodes, [0, 0])).toEqual(["Server", "Disks"]);
    expect(pathOf(nodes, ["network", "Wi-Fi"])).toEqual([1, 0]);
    expect(pathOf(nodes, ["Gone"])).toBeNull();
    const outline = outlineFor("Move the office", nodes, [0]);
    expect(outline).toContain("- Server <<< THIS PART >>>");
    expect(outline).toContain("(note: Only the physical ones)");
    expect(outline).toContain("  - Wi-Fi");
  });

  it("lets the AI read the whole plan, its page and the pages linked to the part", async () => {
    suggestParts([0]);
    const job = onlyJob();
    expect(job.label).toBe("Break it down: Server");
    expect(job.spec.where).toBe("Move the office › Server");
    const text = await job.spec.read();
    expect(text).toContain("- Server <<< THIS PART >>>");
    // The other parts are there, so the AI does not suggest them under this one.
    expect(text).toContain("- Network");
    expect(text).toContain("We move to the new office in March.");
    expect(text).toContain("Two racks in the basement.");
    expect(text).toContain("The tasks of the plan:\n- Order new racks");
    expect(job.instruction).toMatch(/already somewhere in the plan/);
  });

  it("adds the ticked parts under the part, found by its words after the plan changed", async () => {
    suggestParts([1]);
    const job = onlyJob();
    // Meanwhile a part was put before Network.
    page = PAGE.replace("- Network", "- Budget\n- Network");
    usePlanStore.setState({ nodes: parsePlan(page).nodes });
    expect(job.spec.parse("- Switches\n- Cables")).toEqual({
      points: [],
      items: ["Switches", "Cables"],
    });
    await job.spec.add(["Switches", "Wi-Fi"], { points: [], items: [] });
    expect(page).toContain("- Network\n  - Wi-Fi\n  - Switches\n");
    // Wi-Fi was already there and is not added twice.
    expect(page.match(/Wi-Fi/g)).toHaveLength(1);
  });

  it("does not write when the part is gone", async () => {
    suggestParts([1]);
    const job = onlyJob();
    page = PAGE.replace(/- Network\n {2}- Wi-Fi\n/, "");
    usePlanStore.setState({ nodes: parsePlan(page).nodes });
    await expect(job.spec.add(["Switches"], { points: [], items: [] })).rejects.toThrow(
      /no longer in the plan/,
    );
    expect(apiMock.writeNote).not.toHaveBeenCalled();
  });
});
