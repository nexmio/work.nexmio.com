import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { useAiJobStore, type PickJob } from "@/stores/aiJobStore";
import { PickJobCard } from "./PickJobCard";

describe("PickJobCard with a text", () => {
  it("shows the answer as paragraphs and saves it, then takes the job out", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const job: PickJob = {
      id: "j",
      kind: "pick",
      status: "ready",
      error: null,
      createdAt: 0,
      label: "Status report",
      instruction: "",
      picks: { points: ["The van is booked.", "Next week we move."], items: [] },
      spec: {
        label: "Status report",
        where: "Week 47",
        instruction: "",
        read: () => Promise.resolve(""),
        notePath: null,
        parse: () => ({ points: [], items: [] }),
        noun: ["paragraph", "paragraphs"],
        addTo: "",
        add: () => Promise.resolve(),
        text: { title: "The report", save: { label: "Save as a page", run } },
      },
    };
    useAiJobStore.setState({ jobs: [job] });
    render(<PickJobCard job={job} />);
    expect(screen.getByRole("region", { name: "The report" })).toHaveTextContent(
      "The van is booked.Next week we move.",
    );
    expect(screen.queryByText(/found no/)).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: /Save as a page/ }));
    expect(run).toHaveBeenCalledWith(job.picks);
    await waitFor(() => {
      expect(useAiJobStore.getState().jobs).toHaveLength(0);
    });
  });
});
