import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSettings } from "@/test/settings";

const api = vi.hoisted(() => ({
  createVault: vi.fn(),
  openVault: vi.fn(),
  getSettings: vi.fn(),
  getTree: vi.fn(),
  getTreeOrder: vi.fn(),
  listProjects: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ api, toApiError: (e: unknown) => ({ message: String(e) }) }));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: vi.fn().mockResolvedValue(undefined) }));

import { useSettingsStore } from "./settingsStore";
import { useVaultStore } from "./vaultStore";

const info = (path: string) => ({ path, name: path.split("/").pop() ?? path, config: {} });

describe("opening and making vaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTree.mockResolvedValue([]);
    api.getTreeOrder.mockResolvedValue({ folders: {} });
    api.listProjects.mockResolvedValue([]);
    useSettingsStore.setState({ settings: makeSettings({ recentVaults: ["/notes/Home"] }) });
  });

  it("a new vault is opened and listed in the vault switcher at once", async () => {
    api.createVault.mockResolvedValue(info("/notes/Test"));
    api.openVault.mockResolvedValue(info("/notes/Test"));
    // The backend puts the vault it opened first in the recent list.
    api.getSettings.mockResolvedValue(
      makeSettings({ recentVaults: ["/notes/Test", "/notes/Home"], lastVault: "/notes/Test" }),
    );
    expect(await useVaultStore.getState().createVault("/notes", "Test")).toBe(true);
    expect(useVaultStore.getState().vault?.path).toBe("/notes/Test");
    expect(useSettingsStore.getState().settings?.recentVaults).toEqual([
      "/notes/Test",
      "/notes/Home",
    ]);
  });

  it("a vault that cannot be opened leaves the open one and the list as they were", async () => {
    useVaultStore.setState({ vault: info("/notes/Home") as never });
    api.openVault.mockRejectedValue(new Error("Folder not found"));
    expect(await useVaultStore.getState().openVault("/notes/Gone")).toBe(false);
    expect(useVaultStore.getState().vault?.path).toBe("/notes/Home");
    expect(useSettingsStore.getState().settings?.recentVaults).toEqual(["/notes/Home"]);
  });
});
