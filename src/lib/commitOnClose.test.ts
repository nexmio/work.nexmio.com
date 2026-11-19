import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSettings } from "@/test/settings";

const api = vi.hoisted(() => ({ commitNow: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/api", () => ({ api, toApiError: (e: unknown) => ({ message: String(e) }) }));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));

import { useSettingsStore } from "@/stores/settingsStore";
import { commitOnClose } from "./commitOnClose";

describe("commitOnClose", () => {
  beforeEach(() => {
    api.commitNow.mockClear();
  });

  it("saves a version of the page when the setting is on", async () => {
    useSettingsStore.setState({ settings: makeSettings({ git: { commitOnClose: true } }) });
    commitOnClose("A.md");
    await vi.waitFor(() => {
      expect(api.commitNow).toHaveBeenCalledWith({ kind: "save", detail: "A.md" }, ["A.md"]);
    });
  });

  it("does nothing when it is off, or for a file that is not a page", () => {
    useSettingsStore.setState({ settings: makeSettings() });
    commitOnClose("A.md");
    useSettingsStore.setState({ settings: makeSettings({ git: { commitOnClose: true } }) });
    commitOnClose("pic.png");
    expect(api.commitNow).not.toHaveBeenCalled();
  });
});
