import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { usePlanStore } from "@/stores/planStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { FOLDERS_VERSION, type Migration } from "./migrate";
import { Shell, close } from "./PlanDialogShell";
import { useMigrations } from "./useMigrations";

const count = (n: number): string => `${String(n)} ${n === 1 ? "page" : "pages"}`;

/** Moves the pages, then reads the plan again (its links were rewritten). */
async function move(moves: { from: string; to: string }[]): Promise<boolean> {
  const plan = usePlanStore.getState().path;
  const ok = await useVaultStore.getState().movePages(moves);
  if (plan !== null && usePlanStore.getState().path === plan) {
    await usePlanStore.getState().open(plan);
  }
  return ok;
}

async function moveWithUndo(chosen: Migration[]): Promise<void> {
  const moves = chosen.map(({ from, to }) => ({ from, to }));
  if (!(await move(moves))) return;
  useUiStore.getState().toast(`Moved ${count(moves.length)}.`, "success", {
    label: "Undo",
    run: () => {
      void move(moves.map(({ from, to }) => ({ from: to, to: from })));
    },
  });
}

/** Shows which pages of the parts would move where; only the ticked ones are moved. */
export function MigrateDialog() {
  const found = useMigrations();
  /** The pages whose tick was changed by hand. */
  const [changed, setChanged] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const ticked = (m: Migration): boolean => m.ticked !== changed.has(m.from);
  const chosen = found.filter(ticked);

  return (
    <Shell
      title={`Move to the new folder structure (${FOLDERS_VERSION})`}
      description="Each ticked page moves to the folder of its part and gets the part's name with _page. Links are updated, the text of your pages stays, and you can undo it."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={busy || chosen.length === 0}
            onClick={() => {
              setBusy(true);
              void moveWithUndo(chosen).then(close);
            }}
          >
            Move {count(chosen.length)}
          </Button>
        </>
      }
    >
      {found.length === 0 ? (
        <p className="text-sm text-muted-foreground">Every page of a part is where it belongs.</p>
      ) : (
        <ul className="flex max-h-72 flex-col gap-3 overflow-auto">
          {found.map((m) => (
            <li key={m.from}>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  className="mt-1"
                  checked={ticked(m)}
                  onChange={() => {
                    setChanged((s) => {
                      const next = new Set(s);
                      if (!next.delete(m.from)) next.add(m.from);
                      return next;
                    });
                  }}
                />
                <span className="min-w-0 break-all">
                  <span className="block">{m.from}</span>
                  <span className="block font-semibold">→ {m.to}</span>
                  {!m.ticked && (
                    <span className="block text-xs text-muted-foreground">
                      In a folder you chose. Tick it to move it too.
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
