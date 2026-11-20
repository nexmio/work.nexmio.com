import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "@/stores/uiStore";
import { RightTabs } from "./RightTabs";

const TABS = ["outline", "links", "history", "images"] as const;

describe("RightTabs", () => {
  beforeEach(() => {
    useUiStore.setState({ rightTab: "outline", rightCollapsed: false, askOpen: false });
  });

  it("shows a tab for each part and marks the chosen one", () => {
    render(<RightTabs tabs={TABS} current="links" />);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Outline",
      "Links",
      "History",
      "Images",
    ]);
    expect(screen.getByRole("tab", { name: "Links" })).toHaveAttribute("aria-selected", "true");
  });

  it("changes the tab, and leaves the AI box as it is", async () => {
    useUiStore.setState({ askOpen: true });
    render(<RightTabs tabs={TABS} current="outline" />);
    await userEvent.setup().click(screen.getByRole("tab", { name: "History" }));
    expect(useUiStore.getState().rightTab).toBe("history");
    expect(useUiStore.getState().askOpen).toBe(true);
  });

  it("closes the panel", async () => {
    render(<RightTabs tabs={TABS} current="outline" />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Close the panel" }));
    expect(useUiStore.getState().rightCollapsed).toBe(true);
  });
});
