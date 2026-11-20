import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({ readNote: vi.fn(), writeNote: vi.fn(), taggedNotes: vi.fn() }));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));

import { usePlanStore } from "@/stores/planStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { IdeaToPlanDialog } from "./IdeaToPlanDialog";

const PLAN = "Server/Server move.md";
const PAGE = "---\ntags: [plan]\n---\n# Server move\n\n- Servers\n  - Disks\n- Network\n";

describe("IdeaToPlanDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.taggedNotes.mockResolvedValue([{ path: PLAN, content: PAGE }]);
    apiMock.readNote.mockResolvedValue({ path: PLAN, content: PAGE });
    apiMock.writeNote.mockResolvedValue(undefined);
    useVaultStore.setState({
      projects: [{ id: "p", name: "Server move", folder: "Server" } as never],
    });
    usePlanStore.setState({ path: null, plans: [] });
  });

  it("puts the idea under the part chosen, with its note, and marks it used", async () => {
    const done = vi.fn();
    useUiStore.getState().setIdeaToPlan({ text: "Label every cable", note: "Yellow labels", done });
    render(<IdeaToPlanDialog />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Under “Servers”" }));
    await user.click(screen.getByRole("button", { name: "Add to the plan" }));
    await waitFor(() => {
      expect(apiMock.writeNote).toHaveBeenCalled();
    });
    expect(apiMock.writeNote.mock.calls[0]?.[1]).toContain(
      "- Servers\n  - Disks\n  - Label every cable\n    > Yellow labels\n- Network",
    );
    expect(done).toHaveBeenCalled();
    expect(useUiStore.getState().ideaToPlan).toBeNull();
  });

  it("says so when there is no project with a plan", async () => {
    apiMock.taggedNotes.mockResolvedValue([]);
    useUiStore.getState().setIdeaToPlan({ text: "X", note: "", done: vi.fn() });
    render(<IdeaToPlanDialog />);
    expect(await screen.findByText(/There is no project with a plan yet/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to the plan" })).toBeDisabled();
    useUiStore.getState().setIdeaToPlan(null);
  });
});
