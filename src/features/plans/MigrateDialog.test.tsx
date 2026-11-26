import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlanStore } from "@/stores/planStore";
import { useVaultStore } from "@/stores/vaultStore";

vi.mock("./useMigrations", () => ({
  useMigrations: () => [
    { from: "Move/a.md", to: "Move/Pages/a_page.md", ticked: true },
    { from: "Move/Own/b.md", to: "Move/Pages/b_page.md", ticked: false },
  ],
}));

import { MigrateDialog } from "./MigrateDialog";

describe("the window that moves pages to the folder structure", () => {
  const movePages = vi.fn(() => Promise.resolve(true));
  beforeEach(() => {
    vi.clearAllMocks();
    usePlanStore.setState({ path: null });
    useVaultStore.setState({ movePages });
  });

  it("moves nothing until asked, and only the ticked pages", async () => {
    render(<MigrateDialog />);
    expect(movePages).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Move 1 page" }));
    expect(movePages).toHaveBeenCalledWith([{ from: "Move/a.md", to: "Move/Pages/a_page.md" }]);
  });

  it("moves a page from a chosen folder when it is ticked", async () => {
    render(<MigrateDialog />);
    await userEvent.click(screen.getByRole("checkbox", { name: /Own\/b/ }));
    await userEvent.click(screen.getByRole("button", { name: "Move 2 pages" }));
    expect(movePages).toHaveBeenCalledTimes(1);
  });
});
