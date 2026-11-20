import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/components/DiagramPreview", () => ({ DiagramPreview: () => <div>diagram</div> }));

import { useAiJobStore, type EditJob, type PickJob } from "@/stores/aiJobStore";
import { JobsTab } from "./JobsTab";

const job = (over: Partial<EditJob>): EditJob => ({
  kind: "edit",
  id: "1",
  status: "queued",
  label: "Fix spelling",
  command: "fixSpelling",
  instruction: null,
  answer: false,
  diagram: false,
  text: "Hello wrold",
  notePath: "Notes/a.md",
  from: 0,
  to: 11,
  result: "Hello world",
  error: null,
  createdAt: 0,
  ...over,
});

describe("JobsTab", () => {
  beforeEach(() => {
    useAiJobStore.setState({ jobs: [], tab: "tasks" });
  });

  it("explains how to add a task when the queue is empty", () => {
    render(<JobsTab />);
    expect(screen.getByText(/Nothing is waiting/)).toBeInTheDocument();
  });

  it("shows a waiting job and takes it out with the cancel button", async () => {
    useAiJobStore.setState({ jobs: [job({})] });
    render(<JobsTab />);
    expect(screen.getByText(/Waiting/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel: Fix spelling" }));
    expect(useAiJobStore.getState().jobs).toHaveLength(0);
  });

  it("shows why a job failed", () => {
    useAiJobStore.setState({ jobs: [job({ status: "failed", error: "No AI is loaded" })] });
    render(<JobsTab />);
    expect(screen.getByText("No AI is loaded")).toBeInTheDocument();
  });

  it("shows only the new text, the original on request, and accepts through the store", async () => {
    const accept = vi.fn().mockResolvedValue(undefined);
    useAiJobStore.setState({ jobs: [job({ status: "ready" })], accept });
    render(<JobsTab />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Show the original" });
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Show only the new text" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Accept/ }));
    expect(accept).toHaveBeenCalledWith("1");
  });

  it("an answer that only is shown has Copy and Close, not Accept", () => {
    useAiJobStore.setState({ jobs: [job({ status: "ready", answer: true })] });
    render(<JobsTab />);
    expect(screen.getByRole("button", { name: /Copy/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Close/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Accept/ })).not.toBeInTheDocument();
  });

  it("a diagram can be added under the text", () => {
    useAiJobStore.setState({
      jobs: [job({ status: "ready", answer: true, diagram: true, result: "flowchart LR\nA-->B" })],
    });
    render(<JobsTab />);
    expect(screen.getByText("diagram")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add under the text/ })).toBeInTheDocument();
  });

  it("goes back to where a job was asked", async () => {
    const goTo = vi.fn();
    useAiJobStore.setState({ jobs: [job({})], goTo });
    render(<JobsTab />);
    await userEvent.click(screen.getByRole("button", { name: /Go to where you asked/ }));
    expect(goTo).toHaveBeenCalledWith("1");
  });

  it("a list to tick: the points, the items, and only the ticked ones are added", async () => {
    const acceptPicks = vi.fn().mockResolvedValue(undefined);
    const again = vi.fn();
    const pick: PickJob = {
      kind: "pick",
      id: "p1",
      status: "ready",
      error: null,
      createdAt: 0,
      label: "Break it down: Write the rules",
      instruction: "x",
      picks: { points: ["The page is about access"], items: ["List who has access", "Ask Lene"] },
      spec: {
        label: "Break it down: Write the rules",
        where: "Security",
        instruction: "x",
        read: () => Promise.resolve(""),
        notePath: null,
        parse: () => ({ points: [], items: [] }),
        noun: ["step", "steps"],
        addTo: " to the task",
        firstIsStart: true,
        other: { label: "Make the steps smaller", instruction: "smaller" },
        add: () => Promise.resolve(),
        goTo: vi.fn(),
      },
    };
    useAiJobStore.setState({ jobs: [pick], acceptPicks, again });
    render(<JobsTab />);
    const user = userEvent.setup();
    expect(screen.getByText("The page is about access")).toBeInTheDocument();
    expect(screen.getByText("Start here")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Ask Lene/ }));
    await user.click(screen.getByRole("button", { name: /Add 1 step to the task/ }));
    expect(acceptPicks).toHaveBeenCalledWith("p1", ["List who has access"]);
    await user.click(screen.getByRole("button", { name: "Make the steps smaller" }));
    expect(again).toHaveBeenCalledWith("p1", "smaller");
  });
});
