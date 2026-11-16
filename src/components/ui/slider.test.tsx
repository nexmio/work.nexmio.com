import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "./slider";

describe("Slider", () => {
  it("moves while dragged and says when it was let go", () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    render(
      <Slider
        aria-label="Size"
        min={10}
        max={30}
        value={15}
        onChange={onChange}
        onCommit={onCommit}
      />,
    );
    const slider = screen.getByRole("slider", { name: "Size" });
    fireEvent.change(slider, { target: { value: "20" } });
    expect(onChange).toHaveBeenCalled();
    fireEvent.pointerUp(slider);
    fireEvent.keyUp(slider, { key: "ArrowRight" });
    expect(onCommit).toHaveBeenCalledTimes(2);
  });
});
