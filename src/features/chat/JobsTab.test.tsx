import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/components/DiagramPreview", () => ({ DiagramPreview: () => <div>diagram</div> }));

import { useAiJobStore, type AiJob } from "@/stores/aiJobStore";
import { JobsTab } from "./JobsTab";

const job = (over: Partial<AiJob>): AiJob => ({
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
});
