import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const openFile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/actions", () => ({ openFile }));
vi.mock("@/lib/api", () => ({ api: {}, toApiError: (e: unknown) => ({ message: String(e) }) }));

import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { QuickOpen } from "./QuickOpen";

describe("QuickOpen", () => {
  beforeEach(() => {
    openFile.mockReset();
    useUiStore.setState({ quickOpen: true, leftTab: "files", centerView: "notes", searchSeed: "" });
    useVaultStore.setState({ files: ["Work/VPN rollout plan.md", "Meetings/Weekly.md"] });
  });

  it("finds a page by name and opens it", async () => {
    render(<QuickOpen />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Find a page"), "vpn");
    await user.keyboard("{Enter}");
    expect(openFile).toHaveBeenCalledWith("Work/VPN rollout plan.md");
    expect(useUiStore.getState().quickOpen).toBe(false);
  });

  it("has no text-search row until something is typed", () => {
    render(<QuickOpen />);
    expect(screen.queryByText(/Search the text of all pages/)).toBeNull();
  });

  it("offers to search the text of all pages, and opens the search panel with it", async () => {
    render(<QuickOpen />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Find a page"), "licences");
    await user.click(screen.getByText(/Search the text of all pages for/));
    expect(useUiStore.getState().leftTab).toBe("search");
    expect(useUiStore.getState().searchSeed).toBe("licences");
    expect(useUiStore.getState().quickOpen).toBe(false);
    expect(openFile).not.toHaveBeenCalled();
  });

  it("reaches the text-search row with the arrow keys and Enter", async () => {
    render(<QuickOpen />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Find a page"), "zzz");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(useUiStore.getState().searchSeed).toBe("zzz");
  });
});
