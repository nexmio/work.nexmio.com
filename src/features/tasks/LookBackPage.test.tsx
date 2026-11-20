import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  changedPages: vi.fn(),
  aiInline: vi.fn(),
  aiCancel: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
const copied = vi.hoisted(() => ({ text: "" }));
vi.mock("@/lib/clipboard", () => ({
  copyText: (t: string) => {
    copied.text = t;
    return Promise.resolve();
  },
}));
vi.mock("@/lib/useAiBlocked", () => ({ useAiBlocked: () => null }));
vi.mock("@/lib/wake", () => ({ wakeIfNeeded: () => new Promise(() => undefined) }));

import { todayIso } from "@/lib/taskLogic";
import { useAiJobStore } from "@/stores/aiJobStore";
import { useMeetingStore } from "@/stores/meetingStore";
import { useTaskStore } from "@/stores/taskStore";
import { useVaultStore } from "@/stores/vaultStore";
import { makeTask } from "@/test/taskFixtures";
import { LookBackPage } from "./LookBackPage";

describe("LookBackPage", () => {
  beforeEach(() => {
    useAiJobStore.setState({ jobs: [] });
    apiMock.changedPages
      .mockReset()
      .mockResolvedValue([{ path: "Work/Plan.md", changes: 3, new: false, time: 0 }]);
    useTaskStore.setState({
      loaded: true,
      tasks: [
        makeTask({
          title: "Send the quote",
          done: true,
          history: [{ date: todayIso(), text: "Done" }],
          log: [{ line: 9, date: todayIso(), text: "⏱ 45 min", key: "k" }],
        }),
      ],
      epics: [],
    });
    useMeetingStore.setState({ loaded: true, meetings: [] });
    useVaultStore.setState({ projects: [] });
  });

  it("shows this week, copies it as a report, and asks the AI in the queue", async () => {
    const user = userEvent.setup();
    render(<LookBackPage />);
    const done = await screen.findByRole("region", { name: "Done · 1" });
    expect(within(done).getByText(/Send the quote/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Time · 45 min" })).toBeInTheDocument();
    expect(await screen.findByText(/changed 3 times/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "The week after" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Copy as a status report/ }));
    expect(copied.text).toContain("### Done\n- Send the quote");
    await user.click(screen.getByRole("button", { name: /Write it for me/ }));
    expect(useAiJobStore.getState().jobs[0]).toMatchObject({ label: "Status report" });
  });

  it("goes a week back, where nothing happened", async () => {
    render(<LookBackPage />);
    await screen.findByRole("region", { name: "Done · 1" });
    apiMock.changedPages.mockResolvedValue([]);
    await userEvent.setup().click(screen.getByRole("button", { name: "The week before" }));
    expect(await screen.findByRole("region", { name: "Done · 0" })).toHaveTextContent(
      "Nothing this week.",
    );
  });
});
