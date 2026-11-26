import { describe, expect, it } from "vitest";
import { partFolder, partPagePath } from "./partFolder";

describe("the folder for a page of a part", () => {
  it("has a folder for each part above it, and none for the part itself", () => {
    expect(partFolder("Move/Pages", ["test", "dummy"], [])).toBe("Move/Pages/test");
    expect(partFolder("Move/Pages", ["test"], [])).toBe("Move/Pages");
    expect(partFolder("", ["Network"], [])).toBe("");
  });

  it("leaves out what a folder name cannot have", () => {
    expect(partFolder("Move/Pages", ["In/out: #1?", "x"], [])).toBe("Move/Pages/Inout 1");
  });

  it("uses a folder that is there with other capitals", () => {
    expect(
      partFolder("Move/Pages", ["network", "Switches", "x"], ["Move/pages", "Move/pages/Network"]),
    ).toBe("Move/pages/Network/Switches");
  });
});

describe("the file of a page of a part", () => {
  it("is the part's name with _page", () => {
    expect(partPagePath("Move/Pages/test", "dummy", [])).toBe("Move/Pages/test/dummy_page.md");
    expect(partPagePath("", "dummy", [])).toBe("dummy_page.md");
  });

  it("gets a number when the name is taken, whatever the capitals", () => {
    expect(partPagePath("A", "dummy", ["A/Dummy_page.md"])).toBe("A/dummy_page 2.md");
  });
});
