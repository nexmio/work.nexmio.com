import { Code2, Eye } from "lucide-react";
import { InfoHint } from "@/components/InfoHint";
import { Button } from "@/components/ui/button";
import { StartMeetingButton } from "@/features/meetings/StartMeetingButton";
import { formatShortcut } from "@/lib/shortcuts";
import { useUiStore } from "@/stores/uiStore";
import { NoteAiMenu } from "./NoteAiMenu";
import { NoteMenu } from "./NoteMenu";
import { TitleFollowChip } from "./TitleFollowChip";

/**
 * What can be done with the open note, at the right end of the row with its location: follow the
 * title, start the meeting, the note menu, the AI menu and the switch to the Markdown source.
 */
export function NoteActions({ path }: { path: string | null }) {
  const sourceMode = useUiStore((s) => s.sourceMode);
  const label = sourceMode ? "Show live preview" : "Show Markdown source";
  return (
    <span className="ml-auto flex shrink-0 items-center gap-1">
      <TitleFollowChip path={path} />
      <StartMeetingButton path={path} />
      <NoteMenu path={path} showTags={false} />
      <NoteAiMenu path={path} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-pressed={sourceMode}
        title={`${label} (${formatShortcut("Mod+Alt+M")})`}
        onClick={() => {
          useUiStore.getState().setSourceMode(!sourceMode);
        }}
      >
        {sourceMode ? <Eye /> : <Code2 />}
      </Button>
      <InfoHint
        label="Writing pages"
        text="The buttons add the Markdown for you: select text and click, or click and type. Pause on a button to see its name and shortcut."
        topic="writing"
      />
    </span>
  );
}
