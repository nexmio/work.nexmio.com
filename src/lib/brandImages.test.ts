import { describe, expect, it } from "vitest";
import { brandImages } from "./brandImages";
import { THEMES } from "./themes";

describe("brandImages", () => {
  it("gives the dark set to a dark theme and the light set to a light one", () => {
    expect(brandImages(true).appBg).toContain("app-bg-dark");
    expect(brandImages(false).appBg).toContain("app-bg-light");
    expect(brandImages(true).desktopBg).toContain("desktop-bg-dark");
    expect(brandImages(false).desktopBg).toContain("desktop-bg-light");
  });

  it("follows the dark flag of every theme", () => {
    for (const t of THEMES) {
      expect(brandImages(t.dark).appBg).toContain(t.dark ? "dark" : "light");
    }
  });
});
