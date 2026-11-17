import { useSettingsStore } from "@/stores/settingsStore";

/** True when Settings → About → Debug mode is on: right-click menus then offer "Inspect element". */
export function useDebugMode(): boolean {
  return useSettingsStore((s) => s.settings?.debugMode ?? false);
}
