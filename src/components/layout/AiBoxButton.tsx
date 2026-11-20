import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatShortcut } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chatStore";
import { useUiStore } from "@/stores/uiStore";

/**
 * "AI" in the top bar: opens the AI box (the chat and the queue) over the right side, or closes
 * it. A dot says that an answer is being written while the box is closed.
 */
export function AiBoxButton() {
  const open = useUiStore((s) => s.askOpen);
  const streaming = useChatStore((s) => s.streaming);
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-pressed={open}
      aria-label="AI"
      title={`${open ? "Close" : "Open"} the AI (${formatShortcut("Mod+L")})`}
      className={cn("relative gap-1 text-primary", open && "bg-accent")}
      onClick={() => {
        const ui = useUiStore.getState();
        if (open) ui.setAskOpen(false);
        else ui.focusChat();
      }}
    >
      <Sparkles /> AI
      {streaming && !open && (
        <span
          data-testid="ai-streaming-dot"
          aria-label="The AI is writing"
          className="absolute right-1 top-1 size-1.5 rounded-full bg-primary"
        />
      )}
    </Button>
  );
}
