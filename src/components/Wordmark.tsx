import markImage from "@/assets/mark.png";
import { cn } from "@/lib/utils";

/** Pixel sizes of the parts for each size of the wordmark. */
const SIZES = {
  sm: { mark: 20, text: 17, tag: 9.5, padX: 6, padY: 2, gap: 6 },
  md: { mark: 36, text: 32, tag: 11, padX: 8, padY: 3, gap: 8 },
  lg: { mark: 44, text: 39, tag: 12, padX: 9, padY: 3, gap: 9 },
  xl: { mark: 96, text: 84, tag: 20, padX: 14, padY: 6, gap: 16 },
} as const;

export type WordmarkSize = keyof typeof SIZES;

/**
 * The Nexmio Work wordmark: the N mark (an image), the text "exmio" (Poppins SemiBold, real text)
 * and a small purple "Work" tag. The product name is never baked into an image. Colours come from
 * the theme, so it fits light and dark.
 */
export function Wordmark({
  size = "md",
  compact = false,
  className,
}: {
  size?: WordmarkSize;
  /** Only the N mark and the "Work" tag, without "exmio": for tight places such as the top bar. */
  compact?: boolean;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      role="img"
      aria-label="Nexmio Work"
      className={cn("inline-flex items-center leading-none text-foreground", className)}
    >
      <img src={markImage} alt="" aria-hidden draggable={false} style={{ height: s.mark }} />
      {!compact && (
        <span
          aria-hidden
          className="font-semibold tracking-tight"
          style={{
            fontFamily: '"Poppins", system-ui, sans-serif',
            fontSize: s.text,
            marginLeft: 1,
          }}
        >
          exmio
        </span>
      )}
      <span
        aria-hidden
        className="rounded-full border border-primary font-semibold leading-none text-primary"
        style={{
          fontSize: s.tag,
          padding: `${String(s.padY)}px ${String(s.padX)}px`,
          marginLeft: s.gap,
        }}
      >
        Work
      </span>
    </span>
  );
}
