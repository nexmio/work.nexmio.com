import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { draw } from "@/lib/mermaidDraw";
import { cn } from "@/lib/utils";

const STEPS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

/**
 * A Mermaid diagram drawn from its code, on this computer. A diagram with a mistake shows what is
 * wrong and its code. Used where a diagram is proposed before it is written anywhere. It fits the
 * width at first; zoom in and out with the buttons, and make the frame taller to read a big one.
 */
export function DiagramPreview({ source }: { source: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(2);
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.textContent = "Drawing the diagram…";
    void draw(el, source);
  }, [source]);
  const zoom = STEPS[step] ?? 1;
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-end gap-1 border-b px-1 py-0.5">
        <span className="mr-1 text-[11px] tabular-nums text-muted-foreground" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          disabled={step === 0}
          onClick={() => {
            setStep((s) => Math.max(0, s - 1));
          }}
        >
          <ZoomOut />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          disabled={step === STEPS.length - 1}
          onClick={() => {
            setStep((s) => Math.min(STEPS.length - 1, s + 1));
          }}
        >
          <ZoomIn />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={tall ? "Make the frame smaller" : "Make the frame taller"}
          aria-pressed={tall}
          onClick={() => {
            setTall((t) => !t);
          }}
        >
          {tall ? <Minimize2 /> : <Maximize2 />}
        </Button>
      </div>
      <div className={cn("overflow-auto p-2", tall ? "max-h-[70vh]" : "max-h-72")}>
        <div
          ref={box}
          role="img"
          aria-label="The diagram"
          className="diagram-preview mx-auto text-sm [&_svg]:!h-auto [&_svg]:!max-w-none [&_svg]:!w-full"
          style={{ width: `${String(zoom * 100)}%` }}
        />
      </div>
    </div>
  );
}
