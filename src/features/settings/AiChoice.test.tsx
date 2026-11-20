import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderConfig } from "@/bindings/ProviderConfig";
import type { Settings } from "@/bindings/Settings";
import { aiOrder } from "@/lib/aiChoice";

const apiMock = vi.hoisted(() => ({ appPlatform: vi.fn(), aiTest: vi.fn() }));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ message: String(e) }),
}));

vi.mock("@/features/engine/BuiltInAiSettings", () => ({
  BuiltInAiSettings: () => <p>llama setup</p>,
}));

import { AiChoice } from "./AiChoice";

const providers = <p>The providers</p>;
const persist = vi.fn().mockResolvedValue(true);

const lm: ProviderConfig = {
  id: "lmstudio-default",
  kind: "lmstudio",
  name: "LM Studio",
  baseUrl: "http://localhost:1234/v1",
  model: "m",
  location: "local",
  supportsTools: true,
  contextTokens: 16000,
};
const openai: ProviderConfig = {
  ...lm,
  id: "openai",
  kind: "openai_compatible",
  name: "OpenAI",
  baseUrl: "https://api.openai.com/v1",
  location: "cloud",
};

function settings(): Settings {
  return {
    ai: {
      defaultProviderId: "lmstudio-default",
      localProviderId: "",
      providers: [lm, openai],
      cloudConsent: null,
    },
  } as unknown as Settings;
}

describe("Settings → AI → Which AI to use", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.appPlatform.mockResolvedValue({ os: "windows", store: false });
  });

  it("orders the choices the same everywhere (the Store version too), with cloud AI last", () => {
    expect(aiOrder()).toEqual(["llama", "local", "cloud"]);
  });

  it("turns on a cloud AI only after the box is ticked, and records the agreement", async () => {
    const onChange = vi.fn();
    render(
      <AiChoice
        draft={settings()}
        onChange={onChange}
        providersPanel={providers}
        persist={persist}
      />,
    );
    const user = userEvent.setup();
    const list = await screen.findByRole("radiogroup", { name: "AI for Nexmio Work" });
    expect(within(list).getByRole("radio", { name: /LM Studio/ })).toHaveTextContent("In use");
    await user.click(within(list).getByRole("radio", { name: /Cloud AI/ }));
    const use = screen.getByRole("button", { name: "Use the cloud AI" });
    expect(use).toBeDisabled();
    expect(screen.getByText(/everything the AI works on leaves this computer/)).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /my pages are sent to OpenAI/ }));
    await user.click(use);
    const next = onChange.mock.calls[0]?.[0] as Settings;
    expect(next.ai.defaultProviderId).toBe("openai");
    expect(next.ai.cloudConsent).toMatchObject({
      providerId: "openai",
      baseUrl: "https://api.openai.com/v1",
    });
  });

  it("shows a Main AI and a Local AI side by side, and lets the Local AI be chosen", async () => {
    const onChange = vi.fn();
    const draft = settings();
    draft.ai.defaultProviderId = "openai";
    draft.ai.cloudConsent = {
      providerId: "openai",
      baseUrl: "https://api.openai.com/v1",
      agreedAt: "",
    };
    render(
      <AiChoice draft={draft} onChange={onChange} providersPanel={providers} persist={persist} />,
    );
    const cards = await screen.findByTestId("two-ais");
    expect(within(cards).getByText("Main AI").parentElement).toHaveTextContent(
      "Cloud · pages leave this computer",
    );
    expect(within(cards).getByText("Local AI").parentElement).toHaveTextContent("LM Studio");
    await userEvent
      .setup()
      .selectOptions(within(cards).getByLabelText("Local AI"), "lmstudio-default");
    const next = onChange.mock.calls[0]?.[0] as Settings;
    expect(next.ai.localProviderId).toBe("lmstudio-default");
    expect(next.ai.defaultProviderId).toBe("openai");
  });

  it("says the Local AI is the same as the Main AI when the Main AI is on this computer", async () => {
    render(
      <AiChoice
        draft={settings()}
        onChange={vi.fn()}
        providersPanel={providers}
        persist={persist}
      />,
    );
    const cards = await screen.findByTestId("two-ais");
    expect(cards).toHaveTextContent("Same as the Main AI");
  });

  it("keeps the AI on this computer when the warning is closed", async () => {
    const onChange = vi.fn();
    render(
      <AiChoice
        draft={settings()}
        onChange={onChange}
        providersPanel={providers}
        persist={persist}
      />,
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole("radio", { name: /Cloud AI/ }));
    await user.click(screen.getByRole("button", { name: "Keep the AI on this computer" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the setup of the chosen AI right under its row, and only that one", async () => {
    const onChange = vi.fn();
    render(
      <AiChoice
        draft={settings()}
        onChange={onChange}
        providersPanel={providers}
        persist={persist}
      />,
    );
    const user = userEvent.setup();
    const llama = await screen.findByRole("radio", { name: /llama\.cpp/ });
    expect(llama).toHaveTextContent("Not set up");
    // The AI in use (LM Studio) shows its providers; the others show nothing yet.
    expect(screen.getByRole("group", { name: /Set up LM Studio/ })).toHaveTextContent(
      "The providers",
    );
    expect(screen.queryByText("llama setup")).toBeNull();
    await user.click(llama);
    // Choosing one that is not set up changes nothing: its setup opens instead.
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("group", { name: "Set up Built-in AI · llama.cpp" })).toHaveTextContent(
      "llama setup",
    );
    expect(screen.queryByText("The providers")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Set up the chosen AI|Settings of the chosen AI/ }),
    ).toBeNull();
  });

  it("has a Test it button under an AI that is set up, and none under one that is not", async () => {
    render(
      <AiChoice
        draft={settings()}
        onChange={vi.fn()}
        providersPanel={providers}
        persist={persist}
      />,
    );
    const user = userEvent.setup();
    expect(await screen.findByRole("button", { name: "Test it" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /llama\.cpp/ }));
    expect(screen.queryByRole("button", { name: "Test it" })).toBeNull();
  });

  it("marks the built-in AI as beta and recommends none", async () => {
    render(
      <AiChoice
        draft={settings()}
        onChange={vi.fn()}
        providersPanel={providers}
        persist={persist}
      />,
    );
    const list = await screen.findByRole("radiogroup", { name: "AI for Nexmio Work" });
    expect(within(list).getByRole("radio", { name: /llama\.cpp/ })).toHaveTextContent("Beta");
    expect(within(list).getByRole("radio", { name: /LM Studio/ })).not.toHaveTextContent("Beta");
    expect(screen.queryByText(/Recommended here/)).toBeNull();
    expect(screen.getByText(/in beta/)).toBeInTheDocument();
  });
});
