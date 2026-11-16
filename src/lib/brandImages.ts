import { useSyncExternalStore } from "react";
import appBgDark from "@/assets/app-bg-dark.webp";
import appBgLight from "@/assets/app-bg-light.webp";
import bannerBgDark from "@/assets/banner-bg-dark.webp";
import bannerBgLight from "@/assets/banner-bg-light.webp";
import desktopBgDark from "@/assets/desktop-bg-dark.webp";
import desktopBgLight from "@/assets/desktop-bg-light.webp";

/** The brand pictures in one mode (the mode of the active theme). */
export interface BrandImages {
  /** A wide background for panels and dialogs. */
  appBg: string;
  /** A rich banner picture (the hexagons) for a band at the top of a page. */
  banner: string;
  /** A background for a whole window, such as the splash screen. */
  desktopBg: string;
}

const DARK: BrandImages = { appBg: appBgDark, banner: bannerBgDark, desktopBg: desktopBgDark };
const LIGHT: BrandImages = {
  appBg: appBgLight,
  banner: bannerBgLight,
  desktopBg: desktopBgLight,
};

/** The brand pictures for a theme's `dark` flag (`dark: false` gets the light set). */
export function brandImages(dark: boolean): BrandImages {
  return dark ? DARK : LIGHT;
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => {
    observer.disconnect();
  };
}

/** Whether the theme on screen is dark: `applyTheme` puts the `dark` class on the page for it. */
function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

/** The brand pictures for the theme on screen; follows a theme change at once. */
export function useBrandImages(): BrandImages {
  return brandImages(useSyncExternalStore(subscribe, isDark, () => true));
}
