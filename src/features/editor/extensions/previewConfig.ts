import { Facet } from "@codemirror/state";

/** Everything the live-preview extensions need from the app. */
export interface PreviewConfig {
  /** Vault-relative path of the note being edited. */
  notePath: string;
  /** Resolves a wiki-link target to a vault path (null = unresolved). */
  resolveLink: (target: string) => string | null;
  /** Webview URL for a vault-relative file. */
  assetUrl: (vaultPath: string) => string;
  /** True when the vault has a file at this path; lets a picture whose link is stale be found. */
  fileExists?: (vaultPath: string) => boolean;
  /** Ctrl/Cmd+click (or click on an unresolved rendered link). */
  openWikiLink: (target: string, resolved: string | null) => void;
  openTag: (tag: string) => void;
  /** Ctrl/Cmd+click on a standard Markdown link. */
  openHref: (href: string, notePath: string) => void;
  /** The column widths kept for the table with this header (`widthsKey`), if any. */
  tableWidths?: (key: string) => readonly number[] | undefined;
  /** Keeps a table's column widths (an empty list forgets them). Left out: widths cannot be set. */
  saveTableWidths?: (key: string, widths: number[]) => void;
}

const noop = (): void => undefined;

export const defaultPreviewConfig: PreviewConfig = {
  notePath: "",
  resolveLink: () => null,
  assetUrl: (p) => p,
  openWikiLink: noop,
  openTag: noop,
  openHref: noop,
};

export const previewConfig = Facet.define<PreviewConfig, PreviewConfig>({
  combine: (values) => values[values.length - 1] ?? defaultPreviewConfig,
});
