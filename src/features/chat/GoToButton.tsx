import { CornerUpLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** "Go to" on a job in the Queue: back to where it was asked (the page, the plan, the task). */
export function GoToButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-1.5 text-xs"
      aria-label={`Go to where you asked: ${label}`}
      title="Go back to where you asked for this"
      onClick={onClick}
    >
      <CornerUpLeft /> Go to
    </Button>
  );
}
