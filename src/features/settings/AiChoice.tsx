import { useEffect, useState, type ReactNode } from "react";
import type { AppPlatform } from "@/bindings/AppPlatform";
import type { ProviderConfig } from "@/bindings/ProviderConfig";
import type { Settings } from "@/bindings/Settings";
import { Select } from "@/components/ui/select";
import { BuiltInAiSettings } from "@/features/engine/BuiltInAiSettings";
import {
  aiOrder,
  cloudConsented,
  cloudProviders,
  localAiOf,
  optionOf,
  otherLocalProviders,
  type AiOption,
} from "@/lib/aiChoice";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useEngineStore } from "@/stores/engineStore";
import { CloudConsentDialog } from "./CloudConsentDialog";
import { TestAi } from "./TestAi";
import { PlainButton } from "@/components/ui/plain-button";

/** Where Nexmio Work runs; `null` while it is asked (or outside the app, in tests). */
function usePlatform(): AppPlatform | null {
  const [p, setP] = useState<AppPlatform | null>(null);
  useEffect(() => {
    let live = true;
    void Promise.resolve()
      .then(() => api.appPlatform())
      .then((x) => {
        if (live) setP(x);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return p;
}

const TITLES: Record<AiOption, string> = {
  llama: "Built-in AI · llama.cpp",
  local: "LM Studio, or another AI on this computer",
  cloud: "Cloud AI",
};

const TEXTS: Record<AiOption, string> = {
  llama:
    "The open-source engine llama.cpp on the graphics card (Vulkan) or the processor, with a small model you download once. Nothing leaves this computer.",
  local:
    "An AI of your own on this computer, such as LM Studio or Ollama. It must be installed and running.",
  cloud:
    "When no AI on this computer is good enough. Your pages are sent to the company that runs it (OpenAI and others with an OpenAI-compatible address). Off until you turn it on and say you understand.",
};

/** The built-in AI is new: its row says so. */
const BETA: readonly AiOption[] = ["llama"];

/**
 * Settings → AI: one list of the AIs Nexmio Work can use, in the order that suits where it runs, each
 * with its state here. Choosing a ready one makes it the app's AI. The chosen row shows its own
 * setup right under it (a model to download, an address to enter), so there is one place for
 * both. A cloud AI needs the user's "I understand" first.
 */
export function AiChoice({
  draft,
  onChange,
  providersPanel,
  persist,
}: {
  draft: Settings;
  onChange: (next: Settings) => void;
  /** Saves the choices made so far (for "Test it"), without closing Settings. */
  persist: () => Promise<boolean>;
  /** The providers of "LM Studio, or another AI" and of the cloud AI: the list and its editor. */
  providersPanel: ReactNode;
}) {
  const platform = usePlatform();
  const llamaReady = useEngineStore((s) => s.status?.engine != null && s.status.models.length > 0);
  const current = draft.ai.providers.find((p) => p.id === draft.ai.defaultProviderId);
  const [picked, setPicked] = useState<AiOption | null>(null);
  const [asking, setAsking] = useState<ProviderConfig | null>(null);
  const locals = otherLocalProviders(draft);
  const clouds = cloudProviders(draft);
  const [localId, setLocalId] = useState<string>(
    () => (current && locals.some((p) => p.id === current.id) ? current.id : locals[0]?.id) ?? "",
  );
  const [cloudId, setCloudId] = useState<string>(
    () => (current && clouds.some((p) => p.id === current.id) ? current.id : clouds[0]?.id) ?? "",
  );

  const order = aiOrder();
  const inUse = optionOf(current);
  const cloudOn = current !== undefined && inUse === "cloud" && cloudConsented(draft, current);
  const selected = picked ?? inUse;

  const ready: Record<AiOption, boolean> = {
    llama: llamaReady,
    local: locals.length > 0,
    cloud: clouds.length > 0,
  };
  const state = (o: AiOption): string => {
    if (o === inUse && (o !== "cloud" || cloudOn)) return "In use";
    switch (o) {
      case "llama":
        return ready.llama ? "Downloaded" : "Not set up";
      case "local":
        return ready.local ? "Set up" : "Not set up";
      case "cloud":
        return "Off";
    }
  };

  // The two AIs at once: the Main AI is what the app uses (it can be a cloud AI); the Local AI
  // always runs on this computer and is what a project marked Local AI only uses.
  const mainIsLocal = current !== undefined && inUse !== "cloud";
  const localAi = localAiOf(draft);
  const localChoices = draft.ai.providers.filter((p) => {
    const o = optionOf(p);
    return o !== null && o !== "cloud" && ready[o] && (o !== "local" || locals.includes(p));
  });
  const localOption = optionOf(localAi);
  const nameOf = (p: ProviderConfig | undefined): string => (p === undefined ? "None" : p.name);

  const makeProvider = (o: AiOption) => {
    const ai = { ...draft.ai, cloudConsent: null };
    if (o === "llama") {
      onChange({ ...draft, ai: { ...ai, defaultProviderId: "builtin" } });
    } else if (o === "local" && localId !== "") {
      onChange({ ...draft, ai: { ...ai, defaultProviderId: localId } });
    }
  };

  const choose = (o: AiOption) => {
    setPicked(o);
    if (!ready[o]) return;
    if (o === "cloud") {
      const p = clouds.find((c) => c.id === cloudId);
      if (p && !(cloudOn && current.id === p.id)) setAsking(p);
      return;
    }
    makeProvider(o);
  };

  /** The provider "Test it" asks: the one an AI on this computer stands for, once it is set up. */
  const testable = (o: AiOption): ProviderConfig | undefined => {
    if (!ready[o]) return undefined;
    if (o === "llama") return draft.ai.providers.find((p) => p.id === "builtin");
    if (o === "local") return locals.find((p) => p.id === localId) ?? locals[0];
    return undefined;
  };

  /** The setup of an AI, shown under its row while it is chosen. */
  const setupOf = (o: AiOption): ReactNode => {
    switch (o) {
      case "llama":
        return <BuiltInAiSettings draft={draft} onChange={onChange} />;
      case "local":
        return providersPanel;
      case "cloud":
        return (
          <div className="flex flex-col gap-2">
            {!ready.cloud && (
              <p className="text-xs text-muted-foreground">
                Add an OpenAI-compatible provider with its address and key below.
              </p>
            )}
            {providersPanel}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">Which AI to use</h3>
        <p className="text-xs text-muted-foreground">
          {platform?.store
            ? "Nexmio Work runs here as the Microsoft Store version"
            : platform?.os === "windows"
              ? "Nexmio Work runs here on Windows (the installer version)"
              : platform?.os === "linux"
                ? "Nexmio Work runs here on Linux"
                : "Nexmio Work runs on this computer"}
          . Click a row to use it; the chosen row has its own setup under it. The built-in AI is in
          beta: try it, and use an AI of your own if it does not suit your computer.
        </p>
      </div>
      <div className="flex gap-3" data-testid="two-ais">
        <div
          className={cn(
            "flex flex-1 flex-col gap-1 rounded-lg border-2 p-3",
            mainIsLocal ? "border-primary bg-accent" : "border-warning bg-warning/10",
          )}
        >
          <span className="section-label">Main AI</span>
          <span className="text-sm font-semibold">{nameOf(current)}</span>
          <span className="text-xs text-foreground/80">
            Used for everything, unless a project says otherwise.
          </span>
          {!mainIsLocal && current !== undefined && (
            <span className="w-fit rounded-full border border-warning px-2 text-[11px] text-warning">
              Cloud · pages leave this computer
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 rounded-lg border-2 border-primary bg-accent p-3">
          <span className="section-label">Local AI</span>
          <span className="text-sm font-semibold">
            {nameOf(localAi)}
            {mainIsLocal && draft.ai.localProviderId === "" && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Same as the Main AI
              </span>
            )}
          </span>
          <span className="text-xs text-foreground/80">
            Always runs on this computer. Used by projects marked Local AI only.
          </span>
          {localChoices.length > 0 ? (
            <label className="flex items-center gap-2 text-xs">
              Use
              <Select
                aria-label="Local AI"
                value={draft.ai.localProviderId}
                onChange={(e) => {
                  onChange({
                    ...draft,
                    ai: { ...draft.ai, localProviderId: e.target.value },
                  });
                }}
              >
                <option value="">
                  {mainIsLocal ? "Same as the Main AI" : `Automatic (${nameOf(localAi)})`}
                </option>
                {localChoices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {nameOf(p)}
                  </option>
                ))}
              </Select>
            </label>
          ) : (
            <span className="text-xs text-warning" role="status">
              None is set up. A project marked Local AI only has no AI to use until you set one up
              below.
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Both work at the same time. Click a row below to make it the Main AI; the Local AI is chosen
        above.
      </p>
      <div role="radiogroup" aria-label="AI for Nexmio Work" className="flex flex-col gap-2">
        {order.map((o, i) => {
          const cloud = o === "cloud";
          return (
            <div
              key={o}
              className={cn(
                "rounded-lg border",
                cloud && "border-dashed border-warning",
                selected === o &&
                  (cloud
                    ? "border-2 border-warning bg-warning/10"
                    : "border-2 border-primary bg-accent"),
              )}
            >
              <PlainButton
                type="button"
                role="radio"
                aria-checked={selected === o}
                className="flex w-full items-start gap-3 rounded-lg p-3 text-left text-sm hover:bg-muted"
                onClick={() => {
                  choose(o);
                }}
              >
                <span
                  className={cn(
                    "flex size-[22px] shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    selected === o && !cloud && "border-primary bg-primary text-primary-foreground",
                    cloud && "border-warning text-warning",
                  )}
                >
                  {i + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {TITLES[o]}
                    {BETA.includes(o) && (
                      <span className="rounded-full bg-warning/25 px-2 text-[11px] font-normal">
                        Beta
                      </span>
                    )}
                    {o === localOption && (
                      <span className="rounded-full bg-primary px-2 text-[11px] font-normal text-primary-foreground">
                        Local AI
                      </span>
                    )}
                    {cloud && (
                      <span className="rounded-full border border-warning px-2 text-[11px] text-warning">
                        Pages leave this computer
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-foreground/80">{TEXTS[o]}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    state(o) === "In use" ? "font-semibold text-success" : "text-muted-foreground",
                  )}
                >
                  {state(o)}
                </span>
              </PlainButton>
              {selected === o && (
                <div
                  role="group"
                  aria-label={`Set up ${TITLES[o]}`}
                  className="border-t bg-background/60 p-3"
                >
                  {testable(o) !== undefined && (
                    <TestAi provider={testable(o) as ProviderConfig} persist={persist} />
                  )}
                  {setupOf(o)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected === "local" && locals.length > 1 && (
        <label className="flex items-center gap-2 text-sm">
          Which one
          <Select
            value={localId}
            onChange={(e) => {
              setLocalId(e.target.value);
              onChange({
                ...draft,
                ai: { ...draft.ai, cloudConsent: null, defaultProviderId: e.target.value },
              });
            }}
          >
            {locals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
      )}
      {selected === "cloud" && clouds.length > 1 && (
        <label className="flex items-center gap-2 text-sm">
          Which cloud AI
          <Select
            value={cloudId}
            onChange={(e) => {
              setCloudId(e.target.value);
              const p = clouds.find((c) => c.id === e.target.value);
              if (p) setAsking(p);
            }}
          >
            {clouds.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
      )}

      <CloudConsentDialog
        open={asking !== null}
        providerName={asking?.name ?? ""}
        onCancel={() => {
          setAsking(null);
          setPicked(null);
        }}
        onConfirm={() => {
          if (!asking) return;
          onChange({
            ...draft,
            ai: {
              ...draft.ai,
              defaultProviderId: asking.id,
              cloudConsent: {
                providerId: asking.id,
                baseUrl: asking.baseUrl,
                agreedAt: new Date().toISOString(),
              },
            },
          });
          setAsking(null);
        }}
      />
    </div>
  );
}
