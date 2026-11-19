import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTask } from "@/test/taskFixtures";
import { useTaskStore } from "@/stores/taskStore";
import { MoveToEpic } from "./MoveToEpic";

const epics = [
  { path: "Tasks/Acme.md", title: "Acme", source: null, description: "", tags: [] },
  { path: "Tasks/Home.md", title: "Home", source: null, description: "", tags: [] },
];

describe("MoveToEpic", () => {
  beforeEach(() => {
    useTaskStore.setState({ epics });
  });

  it("moves a loose task into the chosen epic", async () => {
    const moveToEpic = vi.fn().mockResolvedValue(undefined);
    useTaskStore.setState({ moveToEpic });
    const task = makeTask({ path: "Loose tasks.md", title: "Call Anna" });
    render(<MoveToEpic task={task} />);
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/Move it into an epic/), "Tasks/Home.md");
    await user.click(screen.getByRole("button", { name: "Move" }));
    expect(moveToEpic).toHaveBeenCalledWith(task, "Tasks/Home.md");
  });

  it("shows nothing for a task that is in an epic", () => {
    const task = makeTask({ path: "Tasks/Acme.md" });
    const { container } = render(<MoveToEpic task={task} />);
    expect(container).toBeEmptyDOMElement();
  });
});
