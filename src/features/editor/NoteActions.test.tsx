import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  noteTags: vi.fn(() => Promise.resolve([])),
  allTags: vi.fn(() => Promise.resolve([])),
  listSkills: vi.fn(() => Promise.resolve([])),
  readNote: vi.fn(() => Promise.resolve({ path: "A.md", content: "", mtime: 0 })),
}));
vi.mock("@/lib/api", () => ({
  api: new Proxy(apiMock, {
    get: (t, k: string) => (t as Record<string, unknown>)[k] ?? vi.fn(() => Promise.resolve([])),
  }),
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));
vi.mock("@/lib/flush", () => ({ flushPendingWrites: () => Promise.resolve() }));

import { useUiStore } from "@/stores/uiStore";
import { NoteActions } from "./NoteActions";

describe("NoteActions", () => {
  beforeEach(() => {
    useUiStore.setState({ sourceMode: false });
  });

  it("has the page menu, the AI menu and the source switch, but no tag chips", () => {
    render(<NoteActions path="Work/Plan.md" />);
    expect(screen.getByRole("button", { name: "More for this page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Markdown source" })).toBeInTheDocument();
    expect(screen.queryByTestId("note-tags-line")).toBeNull();
  });

  it("switches between the live preview and the Markdown source", async () => {
    render(<NoteActions path="Work/Plan.md" />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Show Markdown source" }));
    expect(useUiStore.getState().sourceMode).toBe(true);
    expect(screen.getByRole("button", { name: "Show live preview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
