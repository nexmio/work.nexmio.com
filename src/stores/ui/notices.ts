import type { StateCreator } from "zustand";
import type { RenamePreview } from "@/bindings/RenamePreview";
import type { LinkUpdateChoice, LinkUpdatePrompt, Notice, Toast } from "./types";
import type { UiState } from "./state";

let toastId = 1;

/** Messages: the notice dialog, the toasts and the question about updating links. */
export interface NoticesSlice {
  notice: Notice | null;
  /** Shows a message in a dialog (not a toast that disappears). */
  showNotice: (notice: Notice | null) => void;
  linkUpdate: LinkUpdatePrompt | null;
  toasts: Toast[];
  toast: (message: string, kind?: Toast["kind"], action?: Toast["action"]) => void;
  dismissToast: (id: number) => void;
  askLinkUpdate: (preview: RenamePreview) => Promise<LinkUpdateChoice>;
  answerLinkUpdate: (choice: LinkUpdateChoice) => void;
}

export const noticesSlice: StateCreator<UiState, [], [], NoticesSlice> = (set, get) => ({
  notice: null,
  showNotice: (notice) => {
    set((s) => {
      // Several items that fail one after the other (moving many at once) share one dialog.
      if (notice !== null && s.notice?.title === notice.title) {
        const merged = [
          ...s.notice.details,
          ...notice.details.filter((d) => !s.notice?.details.includes(d)),
        ];
        return { notice: { ...s.notice, details: merged } };
      }
      return { notice };
    });
  },
  linkUpdate: null,
  toasts: [],
  toast: (message, kind = "info", action) => {
    const id = toastId++;
    set((s) => ({
      toasts: [...s.toasts, { id, kind, message, ...(action ? { action } : {}) }],
    }));
    setTimeout(
      () => {
        get().dismissToast(id);
      },
      kind === "error" ? 8000 : action ? 15000 : 4000,
    );
  },
  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
  askLinkUpdate: (preview) =>
    new Promise<LinkUpdateChoice>((resolve) => {
      set({ linkUpdate: { preview, resolve } });
    }),
  answerLinkUpdate: (choice) => {
    const prompt = get().linkUpdate;
    set({ linkUpdate: null });
    prompt?.resolve(choice);
  },
});
