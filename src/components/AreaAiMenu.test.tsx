import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const blocked = vi.hoisted(() => ({ reason: null as string | null }));
vi.mock("@/lib/useAiBlocked", () => ({ useAiBlocked: () => blocked.reason }));

import { AreaAiMenu } from "./AreaAiMenu";

describe("AreaAiMenu", () => {
  it("runs an entry, and an entry that is off says why", async () => {
    const run = vi.fn();
    const user = userEvent.setup();
    render(
      <AreaAiMenu
        label="AI for this project"
        groups={[
          {
            label: "Do",
            entries: [
              { label: "Find what is missing", hint: "Parts", run },
              { label: "Break down the chosen part", hint: "", off: "Choose a part first", run },
            ],
          },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "AI for this project" }));
    expect(screen.getByRole("menuitem", { name: /Break down/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("Choose a part first")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /Find what is missing/ }));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("without an AI says why and nothing can be chosen", async () => {
    blocked.reason = "No AI is set up.";
    render(
      <AreaAiMenu
        label="AI"
        groups={[{ label: "Ask", entries: [{ label: "What is next?", hint: "", run: vi.fn() }] }]}
      />,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "AI" }));
    expect(screen.getByRole("note")).toHaveTextContent("AI is off.");
    expect(screen.getByRole("menuitem", { name: /What is next/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    blocked.reason = null;
  });
});
