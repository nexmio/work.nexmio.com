import { useEffect, useState } from "react";
import { useUiStore } from "@/stores/uiStore";
import { ChatPanel } from "./ChatPanel";

/**
 * The AI (the chat and the queue) as a box with round corners that lies over the right side of
 * the window, from under the top bar to the bottom. It opens over whatever is shown (the start
 * page, a page, a task, the right panel) and changes nothing under it. Esc or × closes it. It stays
 * mounted once it has been shown, so a half-written question survives closing it.
 */
export function AiBox() {
  const open = useUiStore((s) => s.askOpen);
  const [seen, setSeen] = useState(open);
  useEffect(() => {
    if (open) setSeen(true);
  }, [open]);
  if (!seen) return null;
  const close = (): void => {
    useUiStore.getState().setAskOpen(false);
  };
  return (
    <aside
      aria-label="AI"
      hidden={!open}
      onKeyDown={(e) => {
        // A list inside the chat (the page picker) handles its own Esc first.
        if (e.key === "Escape" && !e.defaultPrevented) {
          e.preventDefault();
          close();
        }
      }}
      className="absolute bottom-3 right-3 top-3 z-30 flex w-[380px] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
    >
      <ChatPanel onClose={close} />
    </aside>
  );
}
