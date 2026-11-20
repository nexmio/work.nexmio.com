import { describe, expect, it } from "vitest";
import { filterTags } from "./tags";

describe("the suggestions after #", () => {
  it("never offer a tag of Nexmio Work, which does nothing written in the text", () => {
    const tags = [
      { tag: "meeting", count: 9 },
      { tag: "epic", count: 5 },
      { tag: "pinned", count: 2 },
      { tag: "mette", count: 3 },
      { tag: "q4", count: 1 },
    ];
    expect(filterTags(tags, "me").map((t) => t.tag)).toEqual(["mette"]);
    expect(filterTags(tags, "").map((t) => t.tag)).toEqual(["mette", "q4"]);
  });
});
