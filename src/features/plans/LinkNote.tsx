import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlainButton } from "@/components/ui/plain-button";
import { type NodePath } from "@/lib/planTree";
import { basename } from "@/lib/utils";
import { usePlanStore } from "@/stores/planStore";
import { useVaultStore } from "@/stores/vaultStore";
import { linkNoteTo, plainAt } from "./planActions";
import { Shell, close } from "./PlanDialogShell";

// --- Link a note ------------------------------------------------------------------------------

export function LinkNote({ path }: { path: NodePath }) {
  const files = useVaultStore((s) => s.files);
  const [q, setQ] = useState("");
  const planPath = usePlanStore((s) => s.path);
  const query = q.trim().toLowerCase();
  const found = files
    .filter((f) => /\.md$/i.test(f) && f !== planPath && !f.startsWith(".vault/"))
    .filter((f) => query === "" || f.toLowerCase().includes(query))
    .slice(0, 8);
  return (
    <Shell
      title="Link or make a page"
      description={`Choose the page that goes with “${plainAt(path)}”, or make a new one. The part then points at it.`}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              usePlanStore.getState().setDialog({ kind: "newpage", path });
            }}
          >
            Make a new page…
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <Input
          autoFocus
          aria-label="Search for a page"
          placeholder="Part of the name"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
          }}
        />
        <ul aria-label="Matching pages" className="flex flex-col">
          {found.map((f) => (
            <li key={f}>
              <PlainButton
                type="button"
                className="flex w-full flex-col rounded px-2 py-1 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  void linkNoteTo(path, f).then(close);
                }}
              >
                <span className="font-semibold">{basename(f).replace(/\.md$/i, "")}</span>
                <span className="text-xs text-muted-foreground">{f}</span>
              </PlainButton>
            </li>
          ))}
          {found.length === 0 && (
            <li className="px-2 py-1 text-xs text-muted-foreground">No page matches.</li>
          )}
        </ul>
      </div>
    </Shell>
  );
}
