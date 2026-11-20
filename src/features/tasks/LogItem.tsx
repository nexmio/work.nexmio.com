import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shortDate } from "@/lib/taskLogic";
import { useTaskStore } from "@/stores/taskStore";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MarkdownField } from "@/features/editor/MarkdownField";
import { MarkdownText } from "@/components/MarkdownText";
import type { Task } from "@/bindings/Task";
import type { TaskLog } from "@/bindings/TaskLog";

export function LogItem({ task, entry, today }: { task: Task; entry: TaskLog; today: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.text);
  const [date, setDate] = useState(entry.date);
  const [deleting, setDeleting] = useState(false);
  const store = useTaskStore.getState();
  const save = (): void => {
    const t = text.trim();
    if (t === "" || date === "") return;
    setEditing(false);
    if (t !== entry.text || date !== entry.date) void store.editLog(task, entry, date, t);
  };
  return (
    <li className="group relative pb-4">
      <span
        aria-hidden
        className="absolute -left-[27px] top-1 size-2.5 rounded-full border-2 border-primary bg-card"
      />
      {editing ? (
        <div className="flex flex-col gap-2">
          <Input
            type="date"
            aria-label="Date of the log line"
            className="h-8 w-40"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
            }}
          />
          <MarkdownField
            label="Text of the log line"
            value={text}
            autoFocus
            singleLine
            rows={1}
            onChange={setText}
            submitKey="enter"
            onSubmit={save}
            onEscape={() => {
              setText(entry.text);
              setDate(entry.date);
              setEditing(false);
            }}
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={text.trim() === "" || date === ""} onClick={save}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setText(entry.text);
                setDate(entry.date);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {entry.date === today ? "Today" : shortDate(entry.date)}
            <span className="ml-auto flex gap-0.5 opacity-0 focus-within:opacity-100 group-hover:opacity-100">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-6"
                aria-label="Change this line"
                title="Change this line"
                onClick={() => {
                  setEditing(true);
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-6"
                aria-label="Delete this line"
                title="Delete this line"
                onClick={() => {
                  setDeleting(true);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </span>
          </span>
          <MarkdownText text={entry.text} />
        </>
      )}
      <ConfirmDialog
        open={deleting}
        title="Delete this line from the log?"
        description="It stays in the version history of the page, so it can be brought back."
        confirmLabel="Delete"
        destructive
        onCancel={() => {
          setDeleting(false);
        }}
        onConfirm={() => {
          setDeleting(false);
          void store.deleteLog(task, entry);
        }}
      />
    </li>
  );
}
