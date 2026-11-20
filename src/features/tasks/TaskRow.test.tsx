import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { TaskRow } from "./TaskRow";

const task = makeTask({
  title: "Order 20 extra licences for the new laptops",
  made: "2026-10-30",
  steps: [{ line: 4, text: "Ask for a price", done: false, key: "s1" }],
});

describe("TaskRow", () => {
  it("cuts a long title in the wide list, with its facts beside it", () => {
    render(
      <ul>
        <TaskRow task={task} showNote={false} />
      </ul>,
    );
    const title = screen.getByRole("button", { name: task.title });
    expect(title).toHaveClass("truncate");
    expect(title.parentElement?.textContent).toBe(task.title);
  });

  it("wraps the title in a narrow place, with its facts under it", () => {
    render(
      <ul>
        <TaskRow task={task} showNote={false} narrow />
      </ul>,
    );
    const title = screen.getByRole("button", { name: task.title });
    expect(title).not.toHaveClass("truncate");
    expect(title).toHaveClass("whitespace-normal");
    expect(title.parentElement).toHaveTextContent("0 of 1");
  });
});
