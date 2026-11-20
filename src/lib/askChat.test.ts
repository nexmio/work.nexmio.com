import { beforeEach, describe, expect, it, vi } from "vitest";

const wake = vi.hoisted(() => ({ problem: null as string | null }));
vi.mock("@/lib/wake", () => ({ wakeIfNeeded: () => Promise.resolve(wake.problem) }));
vi.mock("@/lib/api", () => ({
  api: {},
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";
import { askChat } from "./askChat";

describe("askChat", () => {
  const send = vi.fn().mockResolvedValue(undefined);
  beforeEach(() => {
    send.mockClear();
    wake.problem = null;
    useChatStore.setState({ send, streaming: false });
    useUiStore.setState({ toasts: [] });
  });

  it("opens the chat and sends the question", async () => {
    const nonce = useUiStore.getState().focusChatNonce;
    await askChat("What should I do next?");
    expect(useUiStore.getState().focusChatNonce).not.toBe(nonce);
    expect(send).toHaveBeenCalledWith("What should I do next?");
  });

  it("does not interrupt an answer, and says why when the AI cannot start", async () => {
    useChatStore.setState({ streaming: true });
    await askChat("Next?");
    expect(send).not.toHaveBeenCalled();
    useChatStore.setState({ streaming: false });
    wake.problem = "The built-in AI could not start.";
    await askChat("Next?");
    expect(send).not.toHaveBeenCalled();
    expect(useUiStore.getState().toasts.at(-1)?.message).toBe("The built-in AI could not start.");
  });
});
