import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({ api: {}, toApiError: (e: unknown) => ({ message: String(e) }) }));

import { useVaultStore } from "@/stores/vaultStore";
import { PlanProjectNotice } from "./PlanProjectNotice";

describe("PlanProjectNotice", () => {
  beforeEach(() => {
    useVaultStore.setState({
      projects: [
        {
          schemaVersion: 1,
          id: "p",
          name: "Office",
          folder: "Office",
          instructions: "",
          providerId: null,
          localOnly: false,
          createdAt: "",
          updatedAt: "",
        },
      ],
    });
  });

  it("shows nothing for a plan that is in a project", () => {
    const { container } = render(<PlanProjectNotice planPath="Office/Plan.md" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers to move a plan that is in no project into one", () => {
    render(<PlanProjectNotice planPath="Plans/Trip.md" />);
    expect(screen.getByText(/not in a project yet/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move it to a project…" })).toBeInTheDocument();
  });
});
