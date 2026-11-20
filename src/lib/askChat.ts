import { wakeIfNeeded } from "@/lib/wake";
import { useChatStore } from "@/stores/chatStore";
import { reportError, useUiStore } from "@/stores/uiStore";

/**
 * Asks the assistant a question from anywhere (the AI button of an area, a starter in an empty
 * chat): the chat opens, a built-in AI that is not loaded is loaded, and the question is sent.
 * A turn that is still running is not interrupted: the question is then left in nothing and a
 * toast says to wait.
 */
export async function askChat(text: string): Promise<void> {
  const ui = useUiStore.getState();
  ui.focusChat();
  if (useChatStore.getState().streaming) {
    ui.toast("The AI is still answering. Ask again when it is done.", "info");
    return;
  }
  try {
    const problem = await wakeIfNeeded();
    if (problem !== null) {
      ui.toast(problem, "error");
      return;
    }
    await useChatStore.getState().send(text);
  } catch (e) {
    reportError(e);
  }
}
