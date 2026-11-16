import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wordmark } from "@/components/Wordmark";
import { PlainButton } from "@/components/ui/plain-button";
import { useBrandImages } from "@/lib/brandImages";
import { openLink } from "@/lib/openLink";
import { RELEASES_URL, appVersion, buildDateLabel, releaseStage } from "@/lib/version";
import { useUiStore } from "@/stores/uiStore";

/** About Nexmio Work: the version, what the app is for, and who made it. */
export function AboutDialog() {
  const open = useUiStore((s) => s.aboutOpen);
  const setOpen = useUiStore((s) => s.setAboutOpen);
  const { appBg } = useBrandImages();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[90vh] max-w-xl overflow-auto p-0"
        closeClassName="rounded-full bg-black/55 p-1 text-white hover:bg-black/70 hover:text-white"
      >
        <div
          className="flex h-28 w-full items-center rounded-t-lg bg-cover bg-center px-6"
          style={{ backgroundImage: `url(${appBg})` }}
        >
          <Wordmark size="lg" />
        </div>
        <div className="flex flex-col gap-3 px-6 pb-6 text-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">About Nexmio Work</DialogTitle>
            <DialogDescription data-testid="about-version" className="text-xs">
              Version {appVersion} ({releaseStage}) · built {buildDateLabel()} · Apache-2.0 with the
              Commons Clause
            </DialogDescription>
          </DialogHeader>
          <p>
            Nexmio Work is a pages app for people who want to own their pages. Everything is written
            as plain Markdown files in ordinary folders, so your pages stay readable in any editor
            and are never locked into Nexmio Work.
          </p>
          <p>
            <strong>The idea.</strong> Pages should be safe, in your hands, and easy to keep in
            order. Every change is saved in a built-in version history, so nothing is lost. The AI,
            which runs on this computer, helps you write, structure and find things. It only
            proposes changes: nothing is written until you approve it. Your pages stay on your
            computer; only if you turn on a cloud AI yourself, after a warning, are they sent to it.
            Everything else works without an AI.
          </p>
          <p>
            <strong>Editions.</strong> This is Nexmio Work{" "}
            {releaseStage === "preview" ? "Preview" : "Stable"}. Preview has the newest features and
            changes often; Stable is the finished release. Nexmio Work never looks for updates by
            itself.{" "}
            <PlainButton
              className="underline"
              onClick={() => {
                void openLink(RELEASES_URL);
              }}
            >
              Check for a new version
            </PlainButton>
          </p>
          <p className="border-t pt-3 text-muted-foreground">
            Developed by <strong className="text-foreground">Jesper Ahasverusen Kielsgaard</strong>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
