import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/bindings/Project";

vi.mock("@/lib/api", () => ({ api: {}, toApiError: (e: unknown) => ({ message: String(e) }) }));
const actions = vi.hoisted(() => ({ newNoteInCurrentFolder: vi.fn(), revealInTree: vi.fn() }));
vi.mock("@/lib/actions", () => actions);

import { TreeToolbar } from "./TreeToolbar";
import { useTreeStore } from "@/stores/treeStore";
import { useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";

const project: Project = {
  schemaVersion: 1,
  id: "p1",
  name: "Security",
  folder: "Work/Security",
  instructions: "",
  providerId: null,
  localOnly: false,
  createdAt: "",
  updatedAt: "",
};

describe("TreeToolbar", () => {
  const createStandardNote = vi.fn().mockResolvedValue("x.md");
  const createFolder = vi.fn().mockResolvedValue("Ideas");

  beforeEach(() => {
    vi.clearAllMocks();
    useUiStore.setState({ newPlanNonce: 0, centerView: "notes", projectDialog: null });
    createFolder.mockResolvedValue("Ideas");
    useVaultStore.setState({
      vault: null,
      files: [],
      tree: [],
      projects: [],
      activePath: null,
      selectedPath: null,
      createStandardNote,
      createFolder,
    });
    useTreeStore.setState({ expanded: new Set(), filter: "", sort: "name" });
    useUiStore.setState({ projectDialog: null, toasts: [] });
  });

  async function openMenu(): Promise<ReturnType<typeof userEvent.setup>> {
    const user = userEvent.setup();
    render(<TreeToolbar />);
    await user.click(screen.getByRole("button", { name: "More for pages" }));
    return user;
  }

  it("has no New button of its own: pages are made with New in the navigation and in File", async () => {
    render(<TreeToolbar />);
    expect(screen.queryByRole("button", { name: "New" })).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: "More for pages" }));
    expect(await screen.findByRole("menuitem", { name: /New folder/ })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Quick page/ })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: /^Page$/ })).toBeNull();
  });

  it("New folder asks for a name and creates it", async () => {
    const user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: /New folder/ }));
    await user.type(screen.getByLabelText("Folder name"), "Ideas");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => {
      expect(createFolder).toHaveBeenCalledWith("", "Ideas");
    });
    expect(useUiStore.getState().projectDialog).toBeNull();
  });

  it("New project opens the same window as in Projects (a project and its plan), never a folder here", async () => {
    // Whatever is selected, a project is never made inside a folder or another project.
    useVaultStore.setState({
      projects: [project],
      files: ["Work/Security/a.md"],
      selectedPath: "Work/Security",
      activePath: null,
    });
    const user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: /New project/ }));
    expect(useUiStore.getState().projectDialog).toBeNull();
    expect(useUiStore.getState().newPlanNonce).toBe(1);
    expect(useUiStore.getState().centerView).toBe("plans");
    expect(createFolder).not.toHaveBeenCalled();
  });

  it("there is no way to turn an existing folder into a project from the menus", async () => {
    const user = await openMenu();
    expect(screen.queryByRole("menuitem", { name: /Make project/ })).toBeNull();
    expect(await screen.findByRole("menuitem", { name: /New project…/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
  });

  it("collapse all and sort change the tree settings", async () => {
    useTreeStore.setState({ expanded: new Set(["A", "A/B"]) });
    render(<TreeToolbar />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Collapse all folders" }));
    expect(useTreeStore.getState().expanded.size).toBe(0);
    await user.click(screen.getByRole("button", { name: "Sort" }));
    await user.click(await screen.findByRole("menuitem", { name: /Last changed/ }));
    expect(useTreeStore.getState().sort).toBe("modified");
  });

  it("the show-open-note button needs an open page and then reveals it", async () => {
    render(<TreeToolbar />);
    const button = screen.getByRole("button", { name: "Show the open page in the tree" });
    expect(button).toBeDisabled();
    useVaultStore.setState({ activePath: "Work/Plan.md" });
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
    await userEvent.setup().click(button);
    expect(actions.revealInTree).toHaveBeenCalledWith("Work/Plan.md");
  });
});
