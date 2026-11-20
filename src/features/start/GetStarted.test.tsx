import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { LinkResolver } from "@/lib/links";
import { useMeetingStore } from "@/stores/meetingStore";
import { usePlanStore } from "@/stores/planStore";
import { useTaskStore } from "@/stores/taskStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { GetStarted } from "./GetStarted";

describe("GetStarted", () => {
  beforeEach(() => {
    localStorage.clear();
    useVaultStore.setState({
      vault: { name: "V", path: "/v" } as never,
      resolver: new LinkResolver([]),
    });
    usePlanStore.setState({
      plans: [{ path: "P.md", title: "P", finished: false, ideas: 1 }],
      loaded: true,
    });
    useTaskStore.setState({ tasks: [], epics: [], loaded: true });
    useMeetingStore.setState({ meetings: [] });
    useUiStore.setState({ centerView: "start" });
  });

  it("ticks what is done and gives the next step the main button", async () => {
    render(<GetStarted />);
    expect(screen.getByText("1 of 5")).toBeInTheDocument();
    expect(screen.getByText("Make a plan")).toHaveTextContent("(done)");
    // The next step: break the plan into parts.
    const open = screen.getAllByRole("button", { name: "Open Projects" })[0];
    expect(open).toBeDefined();
    if (open) await userEvent.setup().click(open);
    expect(useUiStore.getState().centerView).toBe("plans");
  });

  it("is closed for this vault with Close, and gone when all is done", async () => {
    const { unmount } = render(<GetStarted />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("region", { name: "Get started" })).toBeNull();
    unmount();
    render(<GetStarted />);
    expect(screen.queryByRole("region", { name: "Get started" })).toBeNull();
  });

  it("waits until the lists are read, so it does not flash", () => {
    useTaskStore.setState({ loaded: false });
    render(<GetStarted />);
    expect(screen.queryByRole("region", { name: "Get started" })).toBeNull();
  });
});
