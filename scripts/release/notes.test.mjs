import { describe, expect, it } from "vitest";
import {
  bullets,
  changelogSection,
  listingPart,
  plain,
  storeListing,
  storeNotes,
} from "./notes.mjs";

const CHANGELOG = `# Changelog

## [Unreleased]

## [0.26.0] - 2026-12-01

### Added

- **A new thing.** It does a
  useful thing with \`code\`.
- **Another.** See [the guide](https://example.com).

### Changed

- **A change.** Now different.

### Fixed

- Something small.

## [0.25.0] - 2026-11-15

### Added

- **Old.** Old text.
`;

describe("release texts", () => {
  it("finds the section of a version, and nothing for a version that is not there", () => {
    const s = changelogSection(CHANGELOG, "0.26.0");
    expect(s).toContain("A new thing");
    expect(s).not.toContain("Old.");
    expect(changelogSection(CHANGELOG, "9.9.9")).toBeNull();
  });

  it("takes the top-level bullets of Added and Changed as plain lines, and leaves Fixed out", () => {
    const list = bullets(changelogSection(CHANGELOG, "0.26.0") ?? "");
    expect(list).toEqual([
      "A new thing. It does a useful thing with code.",
      "Another. See the guide.",
      "A change. Now different.",
    ]);
  });

  it("writes the Store text as bullets that fit, cutting only between bullets", () => {
    const section = changelogSection(CHANGELOG, "0.26.0") ?? "";
    expect(storeNotes(section)).toBe(
      "• A new thing. It does a useful thing with code.\n• Another. See the guide.\n• A change. Now different.",
    );
    expect(storeNotes(section, 60)).toBe("• A new thing. It does a useful thing with code.");
  });

  it("removes Markdown marks", () => {
    expect(plain("**Bold** and `code` and [a link](x)")).toBe("Bold and code and a link");
  });

  it("reads the Store listing from its headings", () => {
    const md =
      "# T\n\n## Short description\n\nShort.\n\n## Description\n\n**Bold** words.\n\n\n\nMore.\n\n## Search terms (up to seven)\n\na, b, c\n\n## Links\n\nx";
    expect(listingPart(md, "Short description")).toBe("Short.");
    expect(storeListing(md)).toEqual({
      shortDescription: "Short.",
      description: "Bold words.\n\nMore.",
      keywords: ["a", "b", "c"],
    });
  });
});
