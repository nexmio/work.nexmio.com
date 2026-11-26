import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parsePlan } from "@/lib/planTree";
import { usePlanStore } from "@/stores/planStore";
import { useVaultStore } from "@/stores/vaultStore";

const makeNote = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock("./planActions", () => ({ makeNote, plainAt: () => "Switches" }));

import { NewPartPageDialog } from "./NewPartPageDialog";

describe("making a page for a part", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePlanStore.setState({
      path: "Move/Plan.md",
      nodes: parsePlan("# Move\n\n- Network\n  - Switches\n").nodes,
    });
    useVaultStore.setState({
      projects: [],
      tree: [{ name: "Archive", path: "Archive", isDir: true, children: [], modified: 0 }],
    });
  });

  it("offers a folder named after the part, and makes the page there", async () => {
    render(<NewPartPageDialog path={[0, 0]} />);
    expect(screen.getByRole("combobox")).toHaveValue("Move/Network/Switches");
    await userEvent.click(screen.getByRole("button", { name: "Make the page" }));
    expect(makeNote).toHaveBeenCalledWith([0, 0], "Move/Network/Switches");
  });

  it("makes it in another folder when one is chosen", async () => {
    render(<NewPartPageDialog path={[0, 0]} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "Archive");
    await userEvent.click(screen.getByRole("button", { name: "Make the page" }));
    expect(makeNote).toHaveBeenCalledWith([0, 0], "Archive");
  });
});
