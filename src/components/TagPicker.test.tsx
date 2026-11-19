import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { cleanTag, TagPicker } from "./TagPicker";

const suggestions = [
  { tag: "kunde-x", count: 5 },
  { tag: "kunde-y", count: 2 },
  { tag: "intern", count: 9 },
];

describe("cleanTag", () => {
  it("takes the # off and accepts one word with a letter in it", () => {
    expect(cleanTag("#kunde-x")).toBe("kunde-x");
    expect(cleanTag("  juridisk ")).toBe("juridisk");
    expect(cleanTag("2026q4")).toBe("2026q4");
    expect(cleanTag("two words")).toBeNull();
    expect(cleanTag("123")).toBeNull();
    expect(cleanTag("Kunde-X")).toBe("kunde-x");
    expect(cleanTag("a/b")).toBeNull();
    expect(cleanTag("")).toBeNull();
  });
});

describe("TagPicker", () => {
  it("shows the tags of the thing, and those it gets from around it with no cross", () => {
    render(
      <TagPicker
        tags={["juridisk"]}
        inherited={["kunde-x"]}
        suggestions={suggestions}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("#kunde-x")).toHaveAttribute("title", "From the epic");
    expect(screen.queryByRole("button", { name: "Take the tag kunde-x off" })).toBeNull();
    expect(screen.getByRole("button", { name: "Take the tag juridisk off" })).toBeInTheDocument();
  });

  it("takes a tag off", async () => {
    const onRemove = vi.fn();
    render(<TagPicker tags={["juridisk"]} suggestions={[]} onAdd={vi.fn()} onRemove={onRemove} />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Take the tag juridisk off" }));
    expect(onRemove).toHaveBeenCalledWith("juridisk");
  });

  it("adds a typed tag with Enter, without the #", async () => {
    const onAdd = vi.fn();
    render(<TagPicker tags={[]} suggestions={suggestions} onAdd={onAdd} onRemove={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add a tag" }));
    await user.type(screen.getByLabelText("New tag"), "#nytag{Enter}");
    expect(onAdd).toHaveBeenCalledWith("nytag");
  });

  it("offers the tags that are used already, most used first, and adds one with a click", async () => {
    const onAdd = vi.fn();
    render(
      <TagPicker tags={["intern"]} suggestions={suggestions} onAdd={onAdd} onRemove={vi.fn()} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add a tag" }));
    const offered = screen.getByRole("list", { name: "Tags you already use" });
    expect(offered).toHaveTextContent("#kunde-x");
    expect(offered).not.toHaveTextContent("#intern");
    await user.type(screen.getByLabelText("New tag"), "kunde-y");
    expect(screen.queryByRole("button", { name: /#kunde-x/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: /#kunde-y/ }));
    expect(onAdd).toHaveBeenCalledWith("kunde-y");
  });

  it("says when a tag is not one word", async () => {
    const onAdd = vi.fn();
    render(<TagPicker tags={[]} suggestions={[]} onAdd={onAdd} onRemove={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add a tag" }));
    await user.type(screen.getByLabelText("New tag"), "two words{Enter}");
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
