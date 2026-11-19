import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  folderTagPreview: vi.fn(),
  folderSetTag: vi.fn(),
  allTags: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  api: apiMock,
  toApiError: (e: unknown) => ({ code: "Unknown", message: String(e) }),
}));

import { FolderTagDialog } from "./FolderTagDialog";
import { useUiStore } from "@/stores/uiStore";

describe("FolderTagDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.allTags.mockResolvedValue([{ tag: "kunde-y", count: 2 }]);
    apiMock.folderTagPreview.mockResolvedValue({
      total: 12,
      changing: ["Acme/Offer.md", "Acme/Contract.md", "Acme/Notes.md", "Acme/A.md", "Acme/B.md"],
    });
  });

  it("says how many pages change before anything is written, then writes the tag", async () => {
    apiMock.folderSetTag.mockResolvedValue(["Acme/Offer.md", "Acme/Contract.md"]);
    const close = vi.fn();
    render(<FolderTagDialog action={{ folder: "Acme", name: "Acme", on: true }} close={close} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Tag"), "#Kunde-X");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "12 pages in Acme and its folders · 5 will change",
    );
    expect(screen.getByRole("status")).toHaveTextContent("Offer · Contract · Notes · and 2 more");
    expect(apiMock.folderTagPreview).toHaveBeenLastCalledWith("Acme", "kunde-x", true);
    expect(apiMock.folderSetTag).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Add the tag to 5 pages" }));
    await waitFor(() => {
      expect(apiMock.folderSetTag).toHaveBeenCalledWith("Acme", "kunde-x", true);
    });
    expect(close).toHaveBeenCalled();
    expect(useUiStore.getState().toasts.at(-1)?.message).toContain("History can bring them back");
  });

  it("offers the tags you already use as a click", async () => {
    render(<FolderTagDialog action={{ folder: "Acme", name: "Acme", on: true }} close={vi.fn()} />);
    await userEvent.setup().click(await screen.findByRole("button", { name: /#kunde-y/ }));
    expect(screen.getByLabelText("Tag")).toHaveValue("kunde-y");
  });

  it("refuses a tag that is not one word, and one of Nexmio Work's own tags", async () => {
    render(<FolderTagDialog action={{ folder: "Acme", name: "Acme", on: true }} close={vi.fn()} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Tag"), "two words");
    expect(screen.getByRole("alert")).toHaveTextContent("one word");
    await user.clear(screen.getByLabelText("Tag"));
    await user.type(screen.getByLabelText("Tag"), "epic");
    expect(screen.getByRole("alert")).toHaveTextContent("Nexmio Work's own tags");
    expect(screen.getByRole("button", { name: "Add the tag" })).toBeDisabled();
    expect(apiMock.folderTagPreview).not.toHaveBeenCalled();
  });

  it("takes a tag off, and says when no page has it", async () => {
    apiMock.folderTagPreview.mockResolvedValue({ total: 4, changing: [] });
    render(
      <FolderTagDialog action={{ folder: "Acme", name: "Acme", on: false }} close={vi.fn()} />,
    );
    await userEvent.setup().type(screen.getByLabelText("Tag"), "kunde-x");
    expect(await screen.findByRole("status")).toHaveTextContent("No page has this tag.");
    expect(screen.getByRole("button", { name: "Remove the tag" })).toBeDisabled();
  });
});
