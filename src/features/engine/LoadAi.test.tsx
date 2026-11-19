import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EngineStatus } from "@/bindings/EngineStatus";

import { LoadAi } from "./LoadAi";
import { useEngineStore } from "@/stores/engineStore";

const status = (state: EngineStatus["state"]): EngineStatus =>
  ({ state }) as unknown as EngineStatus;

describe("LoadAi", () => {
  const wake = vi.fn().mockResolvedValue(undefined);
  const sleep = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    useEngineStore.setState({ status: status("asleep"), wake, sleep });
  });

  it("offers Load AI while the AI is not loaded, and loads it", async () => {
    render(<LoadAi />);
    expect(screen.getByText("The AI is not loaded.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Load AI" }));
    expect(wake).toHaveBeenCalledTimes(1);
  });

  it("offers Unload AI while it is loaded, and unloads it", async () => {
    useEngineStore.setState({ status: status("awake") });
    render(<LoadAi />);
    expect(screen.getByText("The AI is loaded.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Unload AI" }));
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("is greyed out while it loads or unloads, and not shown before the AI is set up", () => {
    useEngineStore.setState({ status: status("waking") });
    const { rerender } = render(<LoadAi />);
    expect(screen.getByRole("button", { name: "Loading the AI…" })).toBeDisabled();
    useEngineStore.setState({ status: status("notInstalled") });
    rerender(<LoadAi />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
