import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const draw = vi.hoisted(() => vi.fn());
vi.mock("@/lib/mermaidDraw", () => ({ draw }));

import { DiagramPreview } from "./DiagramPreview";

describe("DiagramPreview", () => {
  beforeEach(() => {
    draw.mockReset().mockImplementation((box: HTMLElement) => {
      box.textContent = "drawn";
      return Promise.resolve();
    });
  });

  it("draws the code it is given into a picture", async () => {
    render(<DiagramPreview source={"flowchart LR\nA-->B"} />);
    const picture = screen.getByRole("img", { name: "The diagram" });
    await waitFor(() => {
      expect(picture).toHaveTextContent("drawn");
    });
    expect(draw).toHaveBeenCalledWith(picture, "flowchart LR\nA-->B");
  });

  it("draws again when the code changes", async () => {
    const { rerender } = render(<DiagramPreview source="flowchart LR\nA-->B" />);
    rerender(<DiagramPreview source="flowchart LR\nB-->C" />);
    await waitFor(() => {
      expect(draw).toHaveBeenCalledTimes(2);
    });
  });
  it("zooms in and out in steps and stops at both ends", async () => {
    render(<DiagramPreview source="flowchart LR\nA-->B" />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("150%")).toBeInTheDocument();
    for (let i = 0; i < 6; i++)
      await userEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
  });

  it("makes the frame taller and smaller again", async () => {
    render(<DiagramPreview source="flowchart LR\nA-->B" />);
    await userEvent.click(screen.getByRole("button", { name: "Make the frame taller" }));
    expect(screen.getByRole("button", { name: "Make the frame smaller" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
