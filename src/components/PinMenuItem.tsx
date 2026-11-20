import { Pin, PinOff } from "lucide-react";
import { useEffect, useState } from "react";
import { ContextMenuItem } from "@/components/ui/context-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { flushPendingWrites } from "@/lib/flush";
import { PINNED_TAG } from "@/lib/startPage";
import { reportError, useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

/** Puts the tag `pinned` on a page, or takes it off, and tells the start page. Returns the new state. */
export async function togglePin(path: string): Promise<boolean> {
  await flushPendingWrites();
  const on = !(await api.noteTags(path)).includes(PINNED_TAG);
  await api.noteSetTag(path, PINNED_TAG, on);
  // The editor and the start page read the file again.
  useVaultStore.setState((s) => ({ reloadNonce: s.reloadNonce + 1 }));
  return on;
}

/**
 * "Pin" / "Unpin" (with an icon) for a page (an epic is a page too), in a
 * right-click menu (`kind="context"`) or a ··· menu (`kind="dropdown"`). It reads whether the page
 * is pinned when the menu opens.
 */
export function PinMenuItem({ path, kind }: { path: string; kind: "context" | "dropdown" }) {
  const [pinned, setPinned] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    Promise.resolve()
      .then(() => api.noteTags(path))
      .then((t) => {
        if (live) setPinned(t.includes(PINNED_TAG));
      })
      .catch(() => {
        if (live) setPinned(false);
      });
    return () => {
      live = false;
    };
  }, [path]);
  const run = (): void => {
    togglePin(path)
      .then((on) => {
        useUiStore.getState().toast(on ? "Pinned to the start page." : "Unpinned.", "success");
      })
      .catch(reportError);
  };
  const Icon = pinned === true ? PinOff : Pin;
  const label = pinned === true ? "Unpin" : "Pin";
  return kind === "context" ? (
    <ContextMenuItem disabled={pinned === null} onSelect={run}>
      <Icon className="size-4" aria-hidden /> {label}
    </ContextMenuItem>
  ) : (
    <DropdownMenuItem disabled={pinned === null} onSelect={run}>
      <Icon className="size-4" aria-hidden /> {label}
    </DropdownMenuItem>
  );
}
