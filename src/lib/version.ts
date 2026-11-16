// The running app's version, shown in the status bar, the welcome screen and Settings.

/**
 * Joins a SemVer version and its build metadata (`0.2.0` + `63947f4.dirty` →
 * `0.2.0+63947f4.dirty`). Build metadata identifies the exact build but never changes precedence.
 */
export function formatVersion(version: string, build: string): string {
  return build === "" ? version : `${version}+${build}`;
}

/** Version of the running app, with build metadata when known. */
export const appVersion = formatVersion(__APP_VERSION__, __APP_BUILD__);

/** The two editions: Preview is the newest work and changes often, Stable is the finished release. */
export type Channel = "preview" | "stable";

/**
 * Which edition a build is. The release workflow decides: every release is built as Preview first,
 * and the same version is built as Stable after the owner approves it, with `NEXMIO_EDITION=stable`.
 * Any other build (development, a local build) is Preview.
 */
export function editionOf(value: string): Channel {
  return value === "stable" ? "stable" : "preview";
}

/** The edition of the running app, shown next to the version. */
export const releaseStage: Channel = editionOf(__APP_EDITION__);

/** Where a newer version is announced. Nexmio Work never checks by itself: the person follows this link. */
export const RELEASES_URL = "https://github.com/nexmio/work.nexmio.com/releases";

/** Build time of the running app as a readable local date and time. */
export function buildDateLabel(iso: string = __APP_BUILD_DATE__): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
