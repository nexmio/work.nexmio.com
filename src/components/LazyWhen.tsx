import { Suspense, useState, type ReactNode } from "react";

/**
 * Renders its children (usually a `React.lazy` screen) only from the first time `when` is true,
 * and keeps them after that, so a rarely used window is loaded when it is first opened and still
 * closes with its normal animation. Nothing is shown while it loads (it takes a moment).
 */
export function LazyWhen({ when, children }: { when: boolean; children: ReactNode }) {
  const [seen, setSeen] = useState(when);
  if (when && !seen) setSeen(true);
  if (!seen && !when) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
}
