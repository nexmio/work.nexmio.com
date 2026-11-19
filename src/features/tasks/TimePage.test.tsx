import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { TimePage } from "./TimePage";
import { useTimerStore } from "@/stores/timerStore";
import { useTaskStore } from "@/stores/taskStore";

const iso = (d: Date): string =>
  `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = iso(new Date());

const acme = makeTask({
  path: "Tasks/Acme.md",
  key: "a",
  title: "Draft the offer",
  log: [
    { line: 7, date: today, text: "⏱ 2 h 40 min · 09:00–11:40 · outline", key: "1" },
    { line: 8, date: today, text: "⏱ 30 min", key: "2" },
  ],
});
const home = makeTask({
  path: "Tasks/Home.md",
  key: "h",
  title: "Paint the door",
  log: [{ line: 7, date: today, text: "⏱ 1 h", key: "3" }],
});

describe("TimePage", () => {
  beforeEach(() => {
    // With a timer running the page does not show the form that starts one.
    useTimerStore.setState({
      running: { path: "Tasks/Acme.md", line: 1, title: "Running", startedAt: Date.now() },
    });
    useTaskStore.setState({
      tasks: [acme, home],
      epics: [
        { path: "Tasks/Acme.md", title: "Acme", source: null, description: "", tags: ["kunde-x"] },
        { path: "Tasks/Home.md", title: "Home", source: null, description: "", tags: [] },
      ],
    });
  });

  it("adds up all the time of the period and lists the tasks with the most time first", () => {
    render(<TimePage />);
    expect(screen.getByTestId("time-total")).toHaveTextContent("4 h 10 min");
    const rows = screen.getAllByRole("button", { expanded: false });
    expect(rows[0]).toHaveTextContent("Draft the offer");
  });

  it("a tag narrows it to what has the tag, also through the epic", async () => {
    render(<TimePage />);
    await userEvent.setup().selectOptions(screen.getByLabelText("Tag"), "kunde-x");
    expect(screen.getByTestId("time-total")).toHaveTextContent("3 h 10 min");
    expect(screen.queryByText(/Paint the door/)).toBeNull();
  });

  it("opens a task to show each entry with its hours and note", async () => {
    render(<TimePage />);
    await userEvent.setup().click(screen.getByRole("button", { name: /Draft the offer/ }));
    expect(screen.getByText(/09:00–11:40/)).toBeInTheDocument();
    expect(screen.getByText("outline")).toBeInTheDocument();
  });

  it("says so when there is no time in the period", () => {
    useTaskStore.setState({ tasks: [makeTask({ log: [] })] });
    render(<TimePage />);
    expect(screen.getByText(/No time in this period/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy as CSV" })).toBeDisabled();
  });
});
