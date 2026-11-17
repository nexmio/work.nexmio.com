import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Trail } from "./Trail";

describe("Trail", () => {
  it("shows the steps, takes you to a step with a place, and marks where you are", async () => {
    const go = vi.fn();
    render(
      <Trail
        steps={[{ label: "Office", run: go }, { label: "Plan", run: go }, { label: "Part" }]}
      />,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Office" }));
    expect(go).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Part")).toHaveAttribute("aria-current", "page");
  });

  it("shows nothing for a single step", () => {
    const { container } = render(<Trail steps={[{ label: "Only" }]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
