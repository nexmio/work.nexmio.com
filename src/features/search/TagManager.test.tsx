import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTagStore } from "@/stores/tagStore";
import { useUiStore } from "@/stores/uiStore";

const api = vi.hoisted(() => ({
  allTags: vi.fn(),
  tagUse: vi.fn(),
  tagDelete: vi.fn(),
  tagMake: vi.fn(),
}));
vi.mock("@/lib/api", async (orig) => ({ ...(await orig<object>()), api: { ...api } }));

import { TagManager } from "./TagManager";

describe("TagManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.allTags.mockResolvedValue([
      { tag: "kunde-x", count: 5 },
      { tag: "epic", count: 2 },
    ]);
    useTagStore.setState({
      tags: [
        { tag: "kunde-x", count: 5 },
        { tag: "epic", count: 2 },
      ],
    });
    useUiStore.setState({ tagsOpen: true });
  });

  it("lists your tags, not Nexmio Work's, and finds what has one", async () => {
    render(<TagManager />);
    expect(screen.getByText("#kunde-x")).toBeInTheDocument();
    expect(screen.queryByText("#epic")).toBeNull();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Show everything with kunde-x" }));
    expect(useUiStore.getState().searchSeed).toBe("tag:kunde-x");
  });

  it("makes a tag that nothing has yet", async () => {
    api.tagMake.mockResolvedValue("nytag");
    render(<TagManager />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("New tag"), "#NyTag{Enter}");
    expect(api.tagMake).toHaveBeenCalledWith("nytag");
    await user.type(screen.getByLabelText("New tag"), "two words{Enter}");
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("says what would change before a tag is deleted everywhere", async () => {
    api.tagUse.mockResolvedValue({ pages: ["A.md", "B.md"], tasks: 3 });
    api.tagDelete.mockResolvedValue(["A.md", "B.md"]);
    render(<TagManager />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Delete the tag kunde-x" }));
    expect(await screen.findByText(/2 pages and 3 tasks, everywhere/)).toBeInTheDocument();
    expect(api.tagDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Delete the tag" }));
    expect(api.tagDelete).toHaveBeenCalledWith("kunde-x");
  });
});
