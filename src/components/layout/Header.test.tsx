import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const open = vi.hoisted(() => vi.fn());
vi.mock("@/lib/openLink", () => ({ openLink: open }));
vi.mock("@/lib/api", () => ({ api: {}, toApiError: (e: unknown) => ({ message: String(e) }) }));
vi.mock("@/lib/window", () => ({ setWindowTitle: vi.fn().mockResolvedValue(undefined) }));

import { Header } from "./Header";
import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

describe("Header", () => {
  beforeEach(() => {
    useUiStore.setState({ helpOpen: false, helpTopic: "start" });
    useVaultStore.setState({ vault: null, activePath: null });
  });

  it("has a visible help button that opens the how-to guide", async () => {
    render(<Header />);
    const button = screen.getByRole("button", { name: "How to use Nexmio Work" });
    expect(button).toHaveAttribute("title", expect.stringContaining("F1"));
    await userEvent.setup().click(button);
    expect(useUiStore.getState().helpOpen).toBe(true);
  });

  it("the Help menu also has the guide", async () => {
    render(<Header />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Help menu" }));
    await user.click(await screen.findByRole("menuitem", { name: /How to use Nexmio Work/ }));
    expect(useUiStore.getState().helpOpen).toBe(true);
  });

  it("has the bug, feature and AI-content reports in the Help menu", async () => {
    open.mockResolvedValue(undefined);
    render(<Header />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Help menu" }));
    expect(await screen.findByRole("menuitem", { name: /Report a bug/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Suggest a feature/ })).toBeInTheDocument();
    const ai = screen.getByRole("menuitem", { name: /Report inappropriate AI content/ });
    ai.focus();
    await user.keyboard("{Enter}");
    await vi.waitFor(() => {
      expect(open).toHaveBeenCalledWith(expect.stringContaining("Inappropriate%20AI%20content"));
    });
  });
});

describe("Header: new version", () => {
  it("has Check for new version in the Help menu, and it opens the releases page", async () => {
    open.mockResolvedValue(undefined);
    render(<Header />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Help menu" }));
    const item = await screen.findByRole("menuitem", { name: /Check for new version/ });
    item.focus();
    await user.keyboard("{Enter}");
    await vi.waitFor(() => {
      expect(open).toHaveBeenCalledWith("https://github.com/nexmio/work.nexmio.com/releases");
    });
  });
});

describe("Header: what's new", () => {
  it("has What's new in the Help menu, and it opens the window", async () => {
    useUiStore.setState({ whatsNewOpen: false });
    render(<Header />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Help menu" }));
    const item = await screen.findByRole("menuitem", { name: "What's new" });
    item.focus();
    await user.keyboard("{Enter}");
    expect(useUiStore.getState().whatsNewOpen).toBe(true);
  });
});

describe("Header menus", () => {
  it("keeps File for pages and the vault, Go for places and Help for help", async () => {
    render(<Header />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "File menu" }));
    // The same list as the New button in Files, then the capture box.
    const names = (await screen.findAllByRole("menuitem")).map((i) => i.textContent);
    expect(names.slice(0, 7).map((n) => n.replace(/Ctrl\+.+$|⌘.+$/, "").trim())).toEqual([
      "Page",
      "Meeting note…",
      "Quick page",
      "Task",
      "Idea",
      "Today's daily page",
      "Write it down…",
    ]);
    expect(screen.queryByRole("menuitem", { name: /starter/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /template/i })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /About Nexmio Work/ })).toBeNull();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Go menu" }));
    expect(await screen.findByRole("menuitem", { name: /Ask about my pages/ })).toBeInTheDocument();
  });
});

describe("Header: search and AI status", () => {
  it("has a search field that opens quick open", async () => {
    useUiStore.setState({ quickOpen: false });
    render(<Header />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Search or jump to" }));
    expect(useUiStore.getState().quickOpen).toBe(true);
  });

  it("holds the AI status, and says so while the AI is working", () => {
    useChatStore.setState({ streaming: false });
    const { rerender } = render(<Header />);
    expect(screen.getByTestId("ai-chip")).toBeInTheDocument();
    expect(screen.queryByText("The AI is working…")).toBeNull();
    useChatStore.setState({ streaming: true });
    rerender(<Header />);
    expect(screen.getByText("The AI is working…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
  });
});
