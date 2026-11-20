import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({ noteTags: vi.fn(), noteSetTag: vi.fn() }));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));

import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { PinMenuItem, togglePin } from "./PinMenuItem";

describe("Pin and Unpin", () => {
  beforeEach(() => {
    for (const f of Object.values(apiMock)) f.mockReset();
    useVaultStore.setState({ reloadNonce: 0 });
    useUiStore.setState({ toasts: [] });
  });

  it("pins a page that is not pinned, and tells the start page to read again", async () => {
    apiMock.noteTags.mockResolvedValue(["epic"]);
    apiMock.noteSetTag.mockResolvedValue(["epic", "pinned"]);
    expect(await togglePin("Tasks/Move.md")).toBe(true);
    expect(apiMock.noteSetTag).toHaveBeenCalledWith("Tasks/Move.md", "pinned", true);
    expect(useVaultStore.getState().reloadNonce).toBe(1);
  });

  it("unpins a pinned page", async () => {
    apiMock.noteTags.mockResolvedValue(["pinned"]);
    apiMock.noteSetTag.mockResolvedValue([]);
    expect(await togglePin("Work/Plan.md")).toBe(false);
    expect(apiMock.noteSetTag).toHaveBeenCalledWith("Work/Plan.md", "pinned", false);
  });

  it("says Unpin for a pinned page in a right-click menu, and pins on a press", async () => {
    apiMock.noteTags.mockResolvedValue(["pinned"]);
    apiMock.noteSetTag.mockResolvedValue([]);
    render(
      <ContextMenu>
        <ContextMenuTrigger>
          <span>A page</span>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <PinMenuItem path="Work/Plan.md" kind="context" />
        </ContextMenuContent>
      </ContextMenu>,
    );
    const user = userEvent.setup();
    await user.pointer({ keys: "[MouseRight]", target: screen.getByText("A page") });
    const item = await screen.findByRole("menuitem", { name: "Unpin" });
    await user.click(item);
    expect(apiMock.noteSetTag).toHaveBeenCalledWith("Work/Plan.md", "pinned", false);
    await waitFor(() => {
      expect(useUiStore.getState().toasts.at(-1)?.message).toBe("Unpinned.");
    });
  });
});
