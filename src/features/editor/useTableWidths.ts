import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { reportError } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

type Widths = Partial<Record<string, number[]>>;

const NONE: Widths = {};

/** The column widths of the tables in the open page: read when it opens, kept as they are dragged. */
export function useTableWidths(path: string | null) {
  const reloadNonce = useVaultStore((s) => s.reloadNonce);
  const [kept, setKept] = useState<{ path: string; widths: Widths } | null>(null);
  useEffect(() => {
    if (path === null) return;
    const run = { cancelled: false };
    // Without the widths the tables share the room themselves, so a failed read stays quiet.
    Promise.resolve()
      .then(() => api.tableWidths(path))
      .then((widths) => {
        // Nothing comes back from a backend that does not know the command (tests, pictures).
        const found = (widths as Widths | null) ?? NONE;
        if (!run.cancelled) setKept({ path, widths: found });
      })
      .catch(() => undefined);
    return () => {
      run.cancelled = true;
    };
  }, [path, reloadNonce]);
  const widths = kept !== null && kept.path === path ? kept.widths : NONE;
  const save = useCallback(
    (key: string, columns: number[]) => {
      if (path === null) return;
      setKept((now) => {
        const before = now?.path === path ? now.widths : NONE;
        const others = Object.entries(before).filter(([k]) => k !== key);
        const next: Widths = Object.fromEntries(others);
        if (columns.length > 0) next[key] = columns;
        return { path, widths: next };
      });
      api.setTableWidths(path, key, columns).catch(reportError);
    },
    [path],
  );
  return { widths, save };
}
