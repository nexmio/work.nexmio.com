import { PlainButton } from "@/components/ui/plain-button";
import { usePlanStore } from "@/stores/planStore";
import { FOLDERS_VERSION } from "./migrate";
import { useMigrations } from "./useMigrations";

/**
 * A line above a plan whose project has pages from before the folder per part. It shows only when
 * there is a page Nexmio Work would move by itself; the plan's menu offers the rest.
 */
export function MigrateNotice() {
  const waiting = useMigrations().some((m) => m.ticked);
  if (!waiting) return null;
  return (
    <div className="shrink-0 border-b px-5 py-2 text-sm text-muted-foreground">
      Pages of this project are not in the folders of their parts.{" "}
      <PlainButton
        type="button"
        className="text-primary underline"
        onClick={() => {
          usePlanStore.getState().setDialog({ kind: "migrate" });
        }}
      >
        Move to the new folder structure ({FOLDERS_VERSION})…
      </PlainButton>
    </div>
  );
}
