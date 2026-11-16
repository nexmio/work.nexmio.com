import { X } from "lucide-react";
import { PlainButton } from "@/components/ui/plain-button";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chatStore";
import { type RightTab, useUiStore } from "@/stores/uiStore";

export const RIGHT_LABELS: Record<RightTab, string> = {
  task: "Task",
  part: "Part",
  outline: "Outline",
  links: "Links",
  history: "History",
  images: "Images",
  ai: "AI",
};

/**
 * The tabs across the top of the right panel, and the button that closes the panel. The streaming
 * dot on the AI tab says an answer is being written, also while another tab is shown.
 */
export function RightTabs({ tabs, current }: { tabs: readonly RightTab[]; current: RightTab }) {
  const streaming = useChatStore((s) => s.streaming);
  return (
    <div className="flex h-9 shrink-0 items-stretch border-b pl-1 pr-1">
      <div
        role="tablist"
        aria-label="Right panel"
        className="flex min-w-0 flex-1 items-stretch overflow-x-auto"
      >
        {tabs.map((id) => (
          <PlainButton
            key={id}
            type="button"
            role="tab"
            aria-selected={current === id}
            className={cn(
              "relative flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap px-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
              current === id
                ? "border-b-2 border-primary font-semibold text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={() => {
              useUiStore.getState().setRightTab(id);
            }}
          >
            {RIGHT_LABELS[id]}
            {id === "ai" && streaming && (
              <span
                data-testid="ai-streaming-dot"
                aria-label="The AI is writing"
                className="size-1.5 rounded-full bg-primary"
              />
            )}
          </PlainButton>
        ))}
      </div>
      <button
        type="button"
        aria-label="Close the panel"
        className="my-1.5 ml-1 rounded p-1 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => {
          useUiStore.getState().toggleRight();
        }}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
