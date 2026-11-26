import { history, undo } from "@codemirror/commands";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it } from "vitest";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { changeOpenPage, registerView } from "./editorViews";

describe("changing a page that is open", () => {
  const view = new EditorView({
    state: EditorState.create({ doc: "Say wrold", extensions: [history()] }),
  });
  afterEach(() => {
    registerView("primary", null);
  });
  const show = (path: string): void => {
    registerView("primary", view);
    useWorkspaceStore.setState({
      layout: { panes: [{ id: "primary", tabs: [path], active: path }], focused: "primary" },
    });
  };

  it("changes it in the editor, and undo takes it back", () => {
    show("a.md");
    expect(changeOpenPage("a.md", "Say wrold", 4, 9, "world")).toBe(true);
    expect(view.state.doc.toString()).toBe("Say world");
    undo(view);
    expect(view.state.doc.toString()).toBe("Say wrold");
  });

  it("does nothing for another page or another text", () => {
    show("b.md");
    expect(changeOpenPage("a.md", "Say wrold", 4, 9, "world")).toBe(false);
    expect(changeOpenPage("b.md", "Something else", 0, 1, "x")).toBe(false);
    expect(view.state.doc.toString()).toBe("Say wrold");
  });
});
