import type { ProviderConfig } from "@/bindings/ProviderConfig";
import type { Settings } from "@/bindings/Settings";
import { effectiveLocation } from "@/lib/providers";

/** The kinds of AI on the AI tab, one line each. */
export type AiOption = "llama" | "local" | "cloud";

export interface Where {
  os: string;
  /** The Microsoft Store package. */
  store: boolean;
}

/**
 * The AI choices: the built-in AI first (llama.cpp, not in the Microsoft Store version yet), then an
 * AI of your own on this computer, and the cloud AI last.
 */
export function aiOrder(w: Where): AiOption[] {
  return w.store ? ["local", "cloud"] : ["llama", "local", "cloud"];
}

/** True when `p` is the cloud AI the user agreed to, at the address they agreed to. */
export function cloudConsented(settings: Settings, p: ProviderConfig): boolean {
  const c = settings.ai.cloudConsent;
  return (
    p.kind === "openai_compatible" &&
    effectiveLocation(p) === "cloud" &&
    c !== null &&
    c.providerId === p.id &&
    c.baseUrl === p.baseUrl
  );
}

/** The cloud AIs that can be turned on (OpenAI-compatible at a cloud address). */
export function cloudProviders(settings: Settings): ProviderConfig[] {
  return settings.ai.providers.filter(
    (p) => p.kind === "openai_compatible" && effectiveLocation(p) === "cloud",
  );
}

/** LM Studio and other servers on this computer (not the built-in engines). */
export function otherLocalProviders(settings: Settings): ProviderConfig[] {
  return settings.ai.providers.filter(
    (p) =>
      (p.kind === "lmstudio" || p.kind === "openai_compatible") && effectiveLocation(p) === "local",
  );
}

/** Which line of the list a provider belongs to. */
export function optionOf(p: ProviderConfig | undefined): AiOption | null {
  if (!p) return null;
  if (p.kind === "builtin") return "llama";
  if (p.kind === "anthropic") return null;
  return effectiveLocation(p) === "cloud" ? "cloud" : "local";
}

/**
 * The Local AI: the AI on this computer that a project marked Local AI only uses, even when the
 * app's AI is a cloud AI. Mirrors the backend: the one chosen under Settings → AI, else the app's
 * AI when it is local, else the first AI on this computer.
 */
export function localAiOf(settings: Settings): ProviderConfig | undefined {
  const local = (p: ProviderConfig | undefined): ProviderConfig | undefined =>
    p && effectiveLocation(p) === "local" ? p : undefined;
  const byId = (id: string): ProviderConfig | undefined =>
    settings.ai.providers.find((p) => p.id === id);
  return (
    local(byId(settings.ai.localProviderId)) ??
    local(byId(settings.ai.defaultProviderId)) ??
    settings.ai.providers.find((p) => effectiveLocation(p) === "local")
  );
}
