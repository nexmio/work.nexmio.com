import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { noteName } from "@/lib/taskLogic";
import { useTaskStore } from "@/stores/taskStore";

/** The lines of the task as they are written in its note: read-only, so it cannot be broken. */
export function MarkdownOfTask({ path, from, to }: { path: string; from: number; to: number }) {
  const [text, setText] = useState<string | null>(null);
  const tasks = useTaskStore((s) => s.tasks);
  useEffect(() => {
    let alive = true;
    api
      .readNote(path)
      .then((n) => {
        if (alive)
          setText(
            n.content
              .split("\n")
              .slice(from, to + 1)
              .join("\n")
              .replace(/\r/g, ""),
          );
      })
      .catch(() => {
        if (alive) setText("");
      });
    return () => {
      alive = false;
    };
  }, [path, from, to, tasks]);
  return (
    <section aria-label="Markdown of the task" className="flex flex-col gap-1">
      <h3 className="section-label">Markdown</h3>
      <pre className="overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">
        {text ?? "…"}
      </pre>
      <p className="text-[11px] text-muted-foreground">
        This is how the task is written in {noteName(path)}. Use the fields below to change it.
      </p>
    </section>
  );
}
