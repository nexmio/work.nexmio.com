import { ArrowUpRight, House } from "lucide-react";

/**
 * Where a thing a part is tied to is kept: a house when it is in the plan's project, an arrow
 * pointing out when it is outside. Nothing for a plan in no project. The chip it stands in has the word.
 */
export function PlaceIcon({
  path,
  outside,
}: {
  path: string;
  outside: ReadonlySet<string> | null;
}) {
  if (outside === null) return null;
  const Icon = outside.has(path) ? ArrowUpRight : House;
  return <Icon className="size-3 shrink-0" aria-hidden />;
}
