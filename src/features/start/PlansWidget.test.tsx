import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { usePlanStore } from "@/stores/planStore";
import { PlansWidget } from "./widgets";

const plan = (path: string, title: string, ideas: number, finished = false) => ({
  path,
  title,
  ideas,
  finished,
});

describe("PlansWidget", () => {
  beforeEach(() => {
    usePlanStore.setState({ plans: [] });
  });

  it("says so when there are no plans", () => {
    render(<PlansWidget />);
    expect(screen.getByText(/No plans yet/)).toBeInTheDocument();
  });

  it("lists only plans that are going, with the number of parts", () => {
    usePlanStore.setState({
      plans: [
        plan("Plans/a.md", "Launch", 1),
        plan("Plans/b.md", "Old", 3, true),
        plan("Plans/c.md", "Move", 4),
      ],
    });
    render(<PlansWidget />);
    expect(screen.getByText("Launch")).toBeInTheDocument();
    expect(screen.getByText("1 part")).toBeInTheDocument();
    expect(screen.getByText("4 parts")).toBeInTheDocument();
    expect(screen.queryByText("Old")).not.toBeInTheDocument();
  });

  it("opens a plan when it is clicked", async () => {
    const open = vi.fn().mockResolvedValue(undefined);
    usePlanStore.setState({ plans: [plan("Plans/a.md", "Launch", 2)], open });
    render(<PlansWidget />);
    await userEvent.click(screen.getByRole("button", { name: /Launch/ }));
    expect(open).toHaveBeenCalledWith("Plans/a.md");
  });
});
