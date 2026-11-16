import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Settings } from "@/bindings/Settings";

vi.mock("@/lib/api", () => ({
  api: {
    hasApiKey: vi.fn().mockResolvedValue(false),
    getDefaultBaseInstruction: vi.fn().mockResolvedValue("default instruction"),
  },
  toApiError: (e: unknown) => ({ message: String(e) }),
}));
vi.mock("@/stores/embeddingStore", () => ({
  useEmbeddingStore: (selector: (s: unknown) => unknown) =>
    selector({ status: null, start: vi.fn(), cancel: vi.fn() }),
}));

import { SettingsContent } from "./SettingsContent";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUiStore } from "@/stores/uiStore";
import { Dialog } from "@/components/ui/dialog";
import { makeSettings } from "@/test/settings";

const stored: Settings = makeSettings({
  ai: {
    providers: [
      {
        id: "lm",
        kind: "lmstudio",
        name: "LM Studio",
        baseUrl: "http://localhost:1234/v1",
        model: "",
        location: "local",
        supportsTools: true,
        contextTokens: 8000,
      },
      {
        id: "claude",
        kind: "anthropic",
        name: "Claude",
        baseUrl: "https://api.anthropic.com",
        model: "",
        location: "cloud",
        supportsTools: true,
        contextTokens: 100000,
      },
      {
        id: "far",
        kind: "lmstudio",
        name: "Far LM Studio",
        baseUrl: "https://models.example.com/v1",
        model: "",
        location: "local",
        supportsTools: true,
        contextTokens: 8000,
      },
    ],
  },
});

describe("Settings → AI: which AI Nexmio Work uses", () => {
  const save = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ settings: stored, save });
  });

  const openAiTab = async (): Promise<ReturnType<typeof userEvent.setup>> => {
    const user = userEvent.setup();
    render(
      <Dialog open>
        <SettingsContent stored={stored} onClose={() => undefined} />
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: /^AI\s*Beta$/ }));
    return user;
  };

  it("shows one list of AIs for Nexmio Work, with cloud AI last and off", async () => {
    await openAiTab();
    const list = screen.getByRole("radiogroup", { name: "AI for Nexmio Work" });
    const lines = within(list).getAllByRole("radio");
    expect(lines.at(-1)).toHaveTextContent(/Cloud AI.*Pages leave this computer.*Off/);
    expect(lines.length).toBeGreaterThanOrEqual(4);
  });

  it("has one AI tab marked Beta, and the set-up sits in the rows, not in folded sections", async () => {
    await openAiTab();
    const nav = screen.getByRole("navigation", { name: "Settings sections" });
    expect(
      within(nav)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual([
      "Appearance",
      "Editor",
      "AIBeta",
      "Tasks and focus",
      "Pages and backup",
      "Shortcuts",
      "About",
    ]);
    expect(screen.getByTestId("ai-beta-note")).toHaveTextContent("still being built");
    expect(screen.queryByRole("button", { name: "Built-in AI: set up" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^More: LM Studio/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Settings of the chosen AI/ })).toBeNull();
    // The AI in use shows its own setup under its row.
    expect(screen.getByRole("group", { name: /^Set up / })).toBeInTheDocument();
  });

  it("has About me and my pages and a language for the AI's answers, and no base instruction", async () => {
    await openAiTab();
    expect(screen.getByLabelText("About me and my pages")).toBeInTheDocument();
    const language = screen.getByLabelText("Language of the AI's answers");
    expect(language).toHaveValue("");
    expect([...language.querySelectorAll("option")].map((o) => o.textContent)).toContain("Danish");
    expect(screen.queryByText(/Nexmio Work's instruction/)).toBeNull();
    expect(screen.queryByText("Global instructions")).toBeNull();
  });

  it("has no Raven setting and no own-knowledge setting any more", async () => {
    await openAiTab();
    expect(screen.queryByLabelText("Raven's provider (cloud AI)")).toBeNull();
    expect(screen.queryByText(/write new content from its own knowledge/)).toBeNull();
  });
});

describe("Settings → AI providers", () => {
  const save = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ settings: stored, save });
  });

  const openProviders = async (): Promise<ReturnType<typeof userEvent.setup>> => {
    const user = userEvent.setup();
    render(
      <Dialog open>
        <SettingsContent stored={stored} onClose={() => undefined} />
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: /^AI\s*Beta$/ }));
    await user.click(screen.getByRole("radio", { name: /LM Studio, or another AI/ }));
    return user;
  };

  it("opens with no provider chosen and says what to do", async () => {
    await openProviders();
    expect(screen.getByText(/Choose a provider on the left/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Base URL")).toBeNull();
    expect(screen.getAllByRole("button", { name: /LM Studio/ }).length).toBeGreaterThan(0);
  });

  it("Add provider offers only local kinds and adds the one chosen", async () => {
    const user = await openProviders();
    await user.click(screen.getByRole("button", { name: /Add provider/ }));
    const note = await screen.findByTestId("add-provider-note");
    expect(note).toHaveTextContent("never leave it");
    const add = screen.getByRole("button", { name: "Add" });
    expect(add).toBeDisabled();
    expect(screen.getByRole("radio", { name: /LM Studio/ })).toHaveTextContent("Local");
    expect(screen.queryByRole("radio", { name: /Anthropic/ })).toBeNull();
    await user.click(screen.getByRole("radio", { name: /Another server on this computer/ }));
    expect(add).toBeEnabled();
    await user.click(add);
    expect(screen.getByLabelText("Kind")).toHaveValue("openai_compatible");
    expect(screen.getByLabelText("Base URL")).toHaveValue("http://localhost:11434/v1");
  });

  it("Cancel in the Add window adds nothing", async () => {
    const user = await openProviders();
    await user.click(screen.getByRole("button", { name: /Add provider/ }));
    await user.click(await screen.findByRole("radio", { name: /LM Studio/ }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("add-provider-note")).toBeNull();
    expect(screen.getByText(/Choose a provider on the left/)).toBeInTheDocument();
  });

  it("lists only the other providers: the built-in engines are set up in their own rows", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open>
        <SettingsContent stored={stored} onClose={() => undefined} />
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: /^AI\s*Beta$/ }));
    await user.click(screen.getByRole("radio", { name: /LM Studio, or another AI/ }));
    expect(screen.getByRole("button", { name: /^LM Studio/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Built-in AI\s*local/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /llama\.cpp/ })).toBeNull();
    expect(screen.getByText(/Choose a provider on the left/)).toBeInTheDocument();
  });
});

describe("Settings: changes apply at once", () => {
  const save = vi.fn<(next: Settings) => Promise<void>>().mockResolvedValue(undefined);
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    save.mockResolvedValue(undefined);
    useSettingsStore.setState({ settings: stored, save });
    useUiStore.setState({ settingsTab: null, toasts: [] });
  });

  const open = (): ReturnType<typeof userEvent.setup> => {
    render(
      <Dialog open>
        <SettingsContent stored={stored} onClose={onClose} />
      </Dialog>,
    );
    return userEvent.setup();
  };

  it("has no Save and no Cancel, only Undo and Close, and says that changes apply at once", () => {
    open();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(screen.getByText("Changes apply at once.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo the last change" })).toBeDisabled();
    // The window has its own cross, and the footer has Close.
    expect(screen.getAllByRole("button", { name: "Close" }).length).toBeGreaterThan(0);
  });

  it("saves a slider by itself, and the preview follows it while it is dragged", async () => {
    const user = open();
    await user.click(screen.getByRole("button", { name: "Editor" }));
    const preview = screen.getByLabelText("Preview");
    fireEvent.change(screen.getByLabelText("Font size"), { target: { value: "20" } });
    expect(screen.getByText("20 px")).toBeInTheDocument();
    expect(within(preview).getByText("VPN rollout plan").parentElement).toHaveStyle({
      fontSize: "20px",
    });
    expect(save).not.toHaveBeenCalled();
    await waitFor(
      () => {
        expect(save).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
    expect(save.mock.calls[0]?.[0].editor.fontSize).toBe(20);
  });

  it("undoes the last change", async () => {
    const user = open();
    await user.click(screen.getByRole("button", { name: "Editor" }));
    fireEvent.change(screen.getByLabelText("Line width"), { target: { value: "900" } });
    await waitFor(
      () => {
        expect(save).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
    const undo = await screen.findByRole("button", { name: "Undo the last change" });
    await waitFor(() => {
      expect(undo).toBeEnabled();
    });
    await user.click(undo);
    await waitFor(() => {
      expect(save).toHaveBeenCalledTimes(2);
    });
    expect(save.mock.calls[1]?.[0].editor.lineWidth).toBe(stored.editor.lineWidth);
    expect(screen.getByLabelText("Line width")).toHaveValue(String(stored.editor.lineWidth));
    expect(screen.getByRole("button", { name: "Undo the last change" })).toBeDisabled();
  });

  it("puts a control back and tells why when a change cannot be saved", async () => {
    save.mockRejectedValue({ code: "Settings", message: "Disk is full" });
    const user = open();
    await user.click(screen.getByRole("button", { name: "Editor" }));
    fireEvent.change(screen.getByLabelText("Font size"), { target: { value: "24" } });
    await waitFor(
      () => {
        expect(useUiStore.getState().toasts.length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    expect(screen.getByLabelText("Font size")).toHaveValue(String(stored.editor.fontSize));
  });

  it("saves what is waiting when Close is pressed, then closes", async () => {
    const user = open();
    await user.click(screen.getByRole("button", { name: "Editor" }));
    fireEvent.change(screen.getByLabelText("Font size"), { target: { value: "18" } });
    const footer = screen.getByText("Changes apply at once.").parentElement as HTMLElement;
    await user.click(within(footer).getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("has the shortcuts and About, and opens the guide and the About window", async () => {
    const user = open();
    await user.click(screen.getByRole("button", { name: "Shortcuts" }));
    expect(screen.getByText(/quick open/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open the guide" }));
    expect(useUiStore.getState().helpOpen).toBe(true);
    await user.click(screen.getByRole("button", { name: "About" }));
    await user.click(screen.getByRole("button", { name: /About Nexmio Work/ }));
    expect(useUiStore.getState().aboutOpen).toBe(true);
  });

  it("puts every control in a section: tasks, pages and backup", async () => {
    const user = open();
    await user.click(screen.getByRole("button", { name: "Tasks and focus" }));
    expect(screen.getByText(/Ask for the next step/)).toBeInTheDocument();
    expect(screen.getByText(/Trace my work/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pages and backup" }));
    expect(screen.getByLabelText("Author name")).toBeInTheDocument();
    expect(screen.getByLabelText("Recent pages shown")).toBeInTheDocument();
  });

  it("opens on the section a link asks for", () => {
    useUiStore.setState({ settingsTab: "vault" });
    open();
    expect(screen.getByRole("button", { name: "Pages and backup" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });
});
