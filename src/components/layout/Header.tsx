import { CircleHelp, PanelLeft, PanelRight, Search } from "lucide-react";
import { AiBoxButton } from "./AiBoxButton";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setWindowTitle } from "@/lib/window";
import { RELEASES_URL, releaseStage } from "@/lib/version";
import { newNoteInCurrentFolder, openDailyNote, openNavArea } from "@/lib/actions";
import { PLANS_LABEL } from "@/lib/planTree";
import { formatShortcut } from "@/lib/shortcuts";
import { Wordmark } from "@/components/Wordmark";
import { AiChip } from "./AiChip";
import { reportAi } from "@/lib/reportAi";
import { openLink } from "@/lib/openLink";
import { reportIssue } from "@/lib/reportIssue";
import { VaultSwitcher } from "@/features/vaults/VaultSwitcher";
import { useProposalStore } from "@/stores/proposalStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { activeTitle, useVaultStore } from "@/stores/vaultStore";

/** Title bar row: the File, Go and Help menus, "vault — note" title and panel toggles. */
export function Header() {
  const vault = useVaultStore((s) => s.vault);
  const activePath = useVaultStore((s) => s.activePath);
  const closeVault = useVaultStore((s) => s.closeVault);
  const ui = useUiStore();
  const lastApplied = useProposalStore((s) => s.lastAppliedSha);
  const title = vault
    ? activePath
      ? `${vault.name} — ${activeTitle(activePath)}`
      : vault.name
    : "Nexmio Work";

  useEffect(() => {
    document.title = title;
    void setWindowTitle(`${title} · Nexmio Work ${releaseStage}`);
  }, [title]);

  const item = (label: string, combo: string | null, run: () => void, disabled = false) => (
    <DropdownMenuItem disabled={disabled} onSelect={run}>
      <span>{label}</span>
      {combo && <DropdownMenuShortcut>{formatShortcut(combo)}</DropdownMenuShortcut>}
    </DropdownMenuItem>
  );
  const menu = (name: string, children: ReactNode) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`${name} menu`}>
          {name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64">{children}</DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="flex h-9 shrink-0 items-center gap-1 border-b bg-sidebar px-2">
      <Wordmark size="sm" compact className="mr-2 ml-1 shrink-0" />
      {menu(
        "File",
        <>
          {item("Page", "Mod+N", newNoteInCurrentFolder)}
          {item("Meeting note…", null, () => {
            ui.setMeetingFormOpen(true);
          })}
          {item("Task", null, () => {
            ui.openCapture("task");
          })}
          {item("Project…", null, () => {
            ui.requestNewPlan();
          })}
          {item("Idea", null, () => {
            ui.openCapture("idea");
          })}
          {item("Today's daily page", "Mod+Shift+D", () => void openDailyNote())}
          <DropdownMenuSeparator />
          {item("Write it down…", "Mod+Shift+N", () => {
            ui.openCapture();
          })}
          {item("Your tags…", null, () => {
            ui.setTagsOpen(true);
          })}
          <DropdownMenuSeparator />
          {item(
            "Export…",
            null,
            () => {
              ui.openExportDialog({ path: activePath ?? "", isFolder: false });
            },
            activePath === null,
          )}
          {item("Import pages from a folder…", null, () => {
            ui.setImportOpen(true);
          })}
          <DropdownMenuSeparator />
          {item("Recover deleted pages…", null, () => {
            ui.setRecoverOpen(true);
          })}
          {item(
            "Undo the last AI change",
            null,
            () => {
              void useProposalStore.getState().undoLast();
            },
            lastApplied === null,
          )}
          <DropdownMenuSeparator />
          {item("Settings…", "Mod+,", () => {
            ui.setSettingsOpen(true);
          })}
          {item("Close the vault", null, () => void closeVault())}
        </>,
      )}
      {menu(
        "Go",
        <>
          {item("Start", "Mod+1", () => {
            openNavArea("start");
          })}
          {item("Pages", "Mod+2", () => {
            openNavArea("pages");
          })}
          {item("Tasks", "Mod+3", () => {
            openNavArea("tasks");
          })}
          {item(PLANS_LABEL, "Mod+4", () => {
            openNavArea("plans");
          })}
          {item("Meetings", "Mod+5", () => {
            openNavArea("meetings");
          })}
          {item("Ideas", "Mod+6", () => {
            openNavArea("ideas");
          })}
          <DropdownMenuSeparator />
          {item("Quick open…", "Mod+P", () => {
            ui.setQuickOpen(true);
          })}
          {item("Command palette…", "Mod+Shift+P", () => {
            ui.setCommandPalette(true);
          })}
          {item("Search", "Mod+Shift+F", () => {
            ui.focusSearch();
          })}
          {item("Ask about my pages", "Mod+L", () => {
            ui.focusChat();
          })}
          <DropdownMenuSeparator />
          {item("History of the page", "Mod+Shift+H", () => {
            ui.setRightTab("history");
          })}
          {item(ui.sourceMode ? "Show live preview" : "Show Markdown source", "Mod+Alt+M", () => {
            ui.setSourceMode(!ui.sourceMode);
          })}
        </>,
      )}
      {menu(
        "Help",
        <>
          {item("How to use Nexmio Work", "F1", () => {
            ui.openHelp();
          })}
          <DropdownMenuSeparator />
          {item("Report a bug…", null, () => {
            reportIssue("bug").catch(reportError);
          })}
          {item("Suggest a feature…", null, () => {
            reportIssue("feature").catch(reportError);
          })}
          {item("Report inappropriate AI content…", null, () => {
            reportAi("chat").catch(reportError);
          })}
          <DropdownMenuSeparator />
          {item("About the AI beta…", null, () => {
            ui.setBetaNoticeOpen(true);
          })}
          {item("What's new", null, () => {
            ui.setWhatsNewOpen(true);
          })}
          {item("Check for new version…", null, () => {
            void openLink(RELEASES_URL);
          })}
          {item("About Nexmio Work…", null, () => {
            ui.setAboutOpen(true);
          })}
        </>,
      )}
      <VaultSwitcher />
      <div className="flex min-w-0 flex-1 justify-center px-2">
        <button
          type="button"
          aria-label="Search or jump to"
          title={`Search or jump to (${formatShortcut("Mod+P")})`}
          className="flex h-6 w-full max-w-[26rem] items-center gap-2 rounded-md border bg-background px-2 text-xs text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            ui.setQuickOpen(true);
          }}
        >
          <Search className="size-3.5 shrink-0" aria-hidden />
          <span className="hidden min-w-0 flex-1 truncate text-left min-[900px]:inline">
            Search or jump to…
          </span>
          <kbd className="ml-auto hidden rounded border px-1 font-mono text-[10px] min-[900px]:inline">
            {formatShortcut("Mod+P")}
          </kbd>
        </button>
      </div>
      <AiChip />
      <AiBoxButton />
      <Button
        variant="ghost"
        size="icon"
        aria-label="How to use Nexmio Work"
        title={`How to use Nexmio Work (${formatShortcut("F1")})`}
        onClick={() => {
          ui.openHelp();
        }}
      >
        <CircleHelp />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle file tree"
        aria-pressed={!ui.leftCollapsed}
        onClick={ui.toggleLeft}
      >
        <PanelLeft />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle right panel"
        aria-pressed={!ui.rightCollapsed}
        onClick={ui.toggleRight}
      >
        <PanelRight />
      </Button>
    </header>
  );
}
