import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({ api: {}, toApiError: (e: unknown) => ({ message: String(e) }) }));

import { StatusBar } from "./StatusBar";
import { useChatStore } from "@/stores/chatStore";

describe("StatusBar", () => {
  beforeEach(() => {
    useChatStore.setState({ streaming: false });
  });

  it("shows the app version", () => {
    render(<StatusBar />);
    expect(screen.getByTestId("app-version").textContent).toMatch(/^v\d+\.\d+\.\d+/);
  });

  it("no longer holds the AI chip (it is in the header)", () => {
    useChatStore.setState({ streaming: true });
    render(<StatusBar />);
    expect(screen.queryByTestId("ai-chip")).toBeNull();
  });
});
