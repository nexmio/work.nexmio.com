import { ChevronDown, Sparkles } from "lucide-react";
import { AiOffNote } from "@/components/AiOffNote";
import { BetaBadge } from "@/components/BetaBadge";
import { MenuText } from "@/components/MenuText";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAiBlocked } from "@/lib/useAiBlocked";
import { cn } from "@/lib/utils";

/** One thing the AI can do in an area. */
export interface AreaAiEntry {
  label: string;
  hint: string;
  run: () => void;
  /** Off for a reason of the area (for example "Choose a part first"). */
  off?: string;
}

/** A group of entries under a small heading ("Do", "Ask"). */
export interface AreaAiGroup {
  label: string;
  entries: AreaAiEntry[];
}

/**
 * The "AI" button of an area (Projects, Tasks, Meetings, Start): the same button and menu as the
 * AI button above a page. A job goes into the AI queue and a question opens the chat; nothing is
 * written before the person accepts it. Without an AI the menu says why and nothing can be chosen.
 */
export function AreaAiMenu({
  label,
  groups,
  className,
  inHeader = true,
}: {
  label: string;
  groups: AreaAiGroup[];
  /** Extra classes for the button (a background over a picture). */
  className?: string;
  /** In a `ViewHeader`: the Beta mark is left out when the header is narrow. */
  inHeader?: boolean;
}) {
  const off = useAiBlocked();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("gap-1 text-primary", className)}
          aria-label={label}
          title={off ?? label}
        >
          <Sparkles /> AI{" "}
          <BetaBadge className={inHeader ? "hidden @3xl/header:inline-flex" : undefined} />{" "}
          <ChevronDown className="size-3" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {off !== null && <AiOffNote reason={off} />}
        {groups.map((g, i) => (
          <div key={g.label}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{g.label}</DropdownMenuLabel>
            {g.entries.map((e) => (
              <DropdownMenuItem
                key={e.label}
                disabled={off !== null || e.off !== undefined}
                title={e.off}
                onSelect={e.run}
              >
                <MenuText label={e.label} hint={e.off ?? e.hint} />
              </DropdownMenuItem>
            ))}
          </div>
        ))}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[11px] text-muted-foreground">
          You see every change before it is written. Free questions: Ctrl/Cmd+L.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
