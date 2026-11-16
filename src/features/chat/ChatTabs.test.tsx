import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAiJobStore, type AiJob } from "@/stores/aiJobStore";
import { ChatTabs } from "./ChatTabs";

const job = (id: string, status: AiJob["status"]): AiJob => ({
  id,
  status,
  label: "Fix",
  command: "fixSpelling",
  instruction: null,
  answer: false,
  diagram: false,
  text: "a",
  notePath: "a.md",
  from: 0,
  to: 1,
  result: "",
  error: null,
  createdAt: 0,
});

describe("ChatTabs", () => {
  beforeEach(() => {
    useAiJobStore.setState({ jobs: [], tab: "chat" });
  });

  it("marks the open tab and switches between Chat and Tasks", async () => {
    render(<ChatTabs />);
    expect(screen.getByRole("button", { name: "Chat" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "Queue" }));
    expect(useAiJobStore.getState().tab).toBe("tasks");
    expect(screen.getByRole("button", { name: "Queue" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows no count when there are no tasks", () => {
    render(<ChatTabs />);
    expect(screen.queryByLabelText(/in the queue/)).not.toBeInTheDocument();
  });

  it("counts the tasks and how many are ready", () => {
    useAiJobStore.setState({ jobs: [job("1", "queued"), job("2", "ready"), job("3", "failed")] });
    render(<ChatTabs />);
    expect(screen.getByLabelText("3 in the queue, 2 ready")).toBeInTheDocument();
  });
});
