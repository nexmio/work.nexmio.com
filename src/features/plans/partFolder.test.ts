import { describe, expect, it } from "vitest";
import { partFolder } from "./partFolder";

describe("the folder for a page of a part", () => {
  it("has a folder for each part down to the part", () => {
    expect(partFolder("Move/Notes", ["Network", "Switches"], [])).toBe(
      "Move/Notes/Network/Switches",
    );
    expect(partFolder("", ["Network"], [])).toBe("Network");
  });

  it("leaves out what a folder name cannot have", () => {
    expect(partFolder("Move/Notes", ["In/out: #1?"], [])).toBe("Move/Notes/Inout 1");
  });

  it("uses a folder that is there with other capitals", () => {
    expect(partFolder("Move/Notes", ["network", "Switches"], ["Move/notes/Network"])).toBe(
      "Move/notes/Network/Switches",
    );
  });
});
