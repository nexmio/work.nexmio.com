import { describe, expect, it } from "vitest";
import { bumpCargoLock, bumpCargoToml, bumpDocs, bumpPackage, hasChangelog } from "./bump.mjs";

describe("version bump", () => {
  it("changes the version in package.json and Cargo.toml, and only the first one", () => {
    expect(
      bumpPackage(
        '{\n  "name": "x",\n  "version": "0.25.0",\n  "dep": {"version": "1"}\n}',
        "0.26.0",
      ),
    ).toContain('"version": "0.26.0"');
    const toml = bumpCargoToml(
      '[package]\nname = "a"\nversion = "0.25.0"\n[dependencies]\nx = { version = "1" }\n',
      "0.26.0",
    );
    expect(toml).toContain('version = "0.26.0"');
    expect(toml).toContain('x = { version = "1" }');
  });

  it("changes only the nexmio-work entry of Cargo.lock", () => {
    const lock =
      'name = "other"\nversion = "1.0.0"\n\n[[package]]\nname = "nexmio-work"\nversion = "0.25.0"\n';
    const out = bumpCargoLock(lock, "0.26.0");
    expect(out).toContain('name = "nexmio-work"\nversion = "0.26.0"');
    expect(out).toContain('name = "other"\nversion = "1.0.0"');
  });

  it("changes the examples in the docs", () => {
    expect(bumpDocs("Version 0.25. text", "0.26.0")).toBe("Version 0.26. text");
    expect(bumpDocs("./Build.ps1 -Version 0.25.0 and NexmioWork_0.25.0.0_x64.msix", "1.0.0")).toBe(
      "./Build.ps1 -Version 1.0.0 and NexmioWork_1.0.0.0_x64.msix",
    );
  });

  it("wants a changelog section", () => {
    expect(hasChangelog("## [0.26.0] - 2026-12-01", "0.26.0")).toBe(true);
    expect(hasChangelog("## [0.25.0] - 2026-11-15", "0.26.0")).toBe(false);
  });
});
