import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ArrangeGrid } from "./ArrangeGrid";

describe("ArrangeGrid", () => {
  it("starts at 3 and picks columns or rows with the number written", async () => {
    const onPick = vi.fn();
    render(<ArrangeGrid now={undefined} count={9} onPick={onPick} />);
    await userEvent.click(screen.getByRole("button", { name: "Columns" }));
    expect(onPick).toHaveBeenLastCalledWith({ by: "cols", n: 3 });
    const input = screen.getByLabelText("How many");
    await userEvent.clear(input);
    await userEvent.type(input, "4");
    await userEvent.click(screen.getByRole("button", { name: "Rows" }));
    expect(onPick).toHaveBeenLastCalledWith({ by: "rows", n: 4 });
  });

  it("keeps the number between 1 and the number of parts", async () => {
    const onPick = vi.fn();
    render(<ArrangeGrid now={undefined} count={5} onPick={onPick} />);
    const input = screen.getByLabelText("How many");
    await userEvent.clear(input);
    await userEvent.type(input, "99");
    await userEvent.click(screen.getByRole("button", { name: "Columns" }));
    expect(onPick).toHaveBeenLastCalledWith({ by: "cols", n: 5 });
  });

  it("ticks the grid in use", () => {
    render(<ArrangeGrid now={{ by: "rows", n: 4 }} count={9} onPick={vi.fn()} />);
    expect(screen.getByLabelText("How many")).toHaveValue(4);
    expect(screen.getByRole("button", { name: "Rows" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Columns" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
