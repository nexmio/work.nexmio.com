import { Wordmark } from "@/components/Wordmark";
import { brandImages } from "@/lib/brandImages";
import { appVersion, releaseStage } from "@/lib/version";

/** The splash is shown before the theme is known, and dark is the default theme. */
const SPLASH_IMAGE = brandImages(true).desktopBg;

/**
 * The start screen: the Nexmio Work picture with the version. It is shown in a small window of its own
 * (a fixed size, no frame) while the app loads; the main window opens when the app is ready.
 */
export function SplashScreen() {
  return (
    <div
      role="img"
      aria-label="Nexmio Work is starting"
      className="relative flex h-screen w-screen select-none justify-center overflow-hidden bg-black"
    >
      <img
        src={SPLASH_IMAGE}
        alt=""
        className="absolute inset-0 size-full object-cover"
        draggable={false}
      />
      <div data-theme="dark" className="dark relative flex flex-1 items-center justify-center">
        <Wordmark size="xl" />
      </div>
      <p className="absolute bottom-3 rounded bg-black/55 px-3 py-0.5 text-xs text-white/80">
        Version {appVersion} {releaseStage}
      </p>
    </div>
  );
}
