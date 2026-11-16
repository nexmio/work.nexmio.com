import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A slider for a number: it moves while it is dragged (`onChange`) and `onCommit` is called when
 * it is let go or a key has set it. Every slider in Nexmio Work is this one.
 */
export function Slider({
  className,
  onCommit,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & { onCommit?: () => void }) {
  return (
    <input
      type="range"
      className={cn("h-2 w-full cursor-pointer accent-[var(--primary)]", className)}
      onPointerUp={onCommit}
      onKeyUp={onCommit}
      {...props}
    />
  );
}
