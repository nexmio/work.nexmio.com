import {
  CalendarPlus,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Presentation,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MarkdownText } from "@/components/MarkdownText";
import { ViewHeader } from "@/components/ViewHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskRow } from "@/features/tasks/TaskRow";
import { api } from "@/lib/api";
import { flushPendingWrites } from "@/lib/flush";
import { decisionsOf, markItem, nextMeetingSeed } from "@/lib/meeting";
import { meetingNotes, type MeetingNote } from "@/lib/meetingList";
import { shortDate, todayIso } from "@/lib/taskLogic";
import { formatTime, type TimeFormat } from "@/lib/timeFormat";
import { cn } from "@/lib/utils";
import { openFile } from "@/lib/actions";
import { useMeetingStore } from "@/stores/meetingStore";
import { useTaskStore } from "@/stores/taskStore";
import { reportError, useUiStore } from "@/stores/uiStore";
import { useVaultStore } from "@/stores/vaultStore";
import { MeetingWhenDialog } from "./MeetingWhenDialog";
import { useMeetingsLoaded, useShownMeeting } from "./useMeetings";
import { Checkbox } from "@/components/ui/checkbox";

/** `Today · 10:00 · with Mette, Peter`. */
function whenLine(m: MeetingNote, today: string, format: TimeFormat): string {
  const { date, time, people } = m.meeting;
  const day = date === null ? "No date" : date === today ? "Today" : shortDate(date);
  return [
    day,
    time === null ? null : formatTime(time, format),
    people.length > 0 ? `with ${people.join(", ")}` : null,
  ]
    .filter((x) => x !== null)
    .join(" · ");
}

/** Ticks or unticks an agenda item in the note itself, from the note as it is on disk. */
async function tickAgenda(path: string, item: string, done: boolean): Promise<void> {
  try {
    await flushPendingWrites();
    const note = await api.readNote(path);
    await api.writeNote(path, markItem(note.content, item, done));
    await useMeetingStore.getState().load();
  } catch (e) {
    reportError(e);
  }
}

/**
 * The middle of the Meetings area: the chosen meeting with its agenda, the tasks from it and what
 * was written, and the buttons to start it, prepare the next one or open its note. Everything is
 * read from the meeting's note, so nothing new is stored.
 */
export function MeetingsView() {
  const today = todayIso();
  const m = useShownMeeting();
  useMeetingsLoaded();
  const loaded = useMeetingStore((s) => s.loaded);
  const tasks = useTaskStore((s) => s.tasks);
  const [busy, setBusy] = useState(false);
  const [changing, setChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timeFormat = useUiStore((s) => s.timeFormat);

  useEffect(() => {
    void useTaskStore.getState().load();
  }, []);

  if (!m) {
    return (
      <section aria-label="Meetings" className="flex h-full min-h-0 flex-col bg-background">
        <ViewHeader title="Meetings">
          <Button
            size="sm"
            onClick={() => {
              useUiStore.getState().setMeetingFormOpen(true);
            }}
          >
            <Plus /> New meeting
          </Button>
        </ViewHeader>
        {loaded && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No meetings yet.</p>
            <p>
              A meeting is a page with the tag <code>meeting</code>. Press <b>New meeting</b>, or
              give a page the tag from its <b>···</b> menu.
            </p>
          </div>
        )}
      </section>
    );
  }

  const fromMeeting = tasks.filter((t) => t.path === m.path);
  const notes = meetingNotes(m);
  const decisions = decisionsOf(m.content);
  const { parts } = m.meeting;
  const done = m.meeting.agenda.filter((a) => a.done).length;

  const prepareNext = (): void => {
    setBusy(true);
    flushPendingWrites()
      .then(() => api.readNote(m.path))
      .then((note) => {
        useUiStore.getState().openMeetingFormWith(nextMeetingSeed(note.content));
      })
      .catch(reportError)
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <section aria-label="Meetings" className="flex h-full min-h-0 flex-col bg-background">
      <ViewHeader title={m.meeting.title}>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void openFile(m.path);
          }}
        >
          <FileText /> Open the page
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" aria-label="More for this meeting">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              disabled={busy}
              onSelect={() => {
                prepareNext();
              }}
            >
              <CalendarPlus /> Prepare next…
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setChanging(true);
              }}
            >
              <Pencil /> Change when…
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setDeleting(true);
              }}
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          size="sm"
          onClick={() => {
            useUiStore.getState().setMeetingFocus(m.path);
          }}
        >
          <Presentation /> Start meeting
        </Button>
      </ViewHeader>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        <p className="pb-3 text-sm text-muted-foreground">{whenLine(m, today, timeFormat)}</p>
        <ConfirmDialog
          open={deleting}
          title={`Delete the meeting “${m.meeting.title}”?`}
          description="Its page and what is written in it are removed, but they stay in the version history, so they can be brought back."
          confirmLabel="Delete"
          destructive
          onCancel={() => {
            setDeleting(false);
          }}
          onConfirm={() => {
            setDeleting(false);
            void useVaultStore
              .getState()
              .deletePath(m.path)
              .then(() => {
                useMeetingStore.getState().select(null);
                return useMeetingStore.getState().load();
              });
          }}
        />
        {changing && (
          <MeetingWhenDialog
            key={m.path}
            meeting={m}
            open
            onClose={() => {
              setChanging(false);
            }}
          />
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <section aria-label="Notes" className="rounded-xl border bg-card p-4">
              <h3 className="section-label pb-1">Pages</h3>
              {notes === "" ? (
                <p className="text-sm text-muted-foreground">Nothing written yet.</p>
              ) : (
                <MarkdownText text={notes} />
              )}
            </section>
            {parts.decisions && (
              <section aria-label="Decisions" className="rounded-xl border bg-card p-4">
                <h3 className="section-label pb-1">Decisions</h3>
                {decisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None written yet.</p>
                ) : (
                  <ul className="flex flex-col gap-1 text-sm">
                    {decisions.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            {parts.agenda && (
              <section aria-label="Agenda" className="rounded-xl border bg-card p-4">
                <h3 className="section-label pb-1">
                  Agenda
                  {m.meeting.agenda.length > 0 &&
                    ` · ${String(done)} of ${String(m.meeting.agenda.length)} done`}
                </h3>
                {m.meeting.agenda.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No agenda. Start the meeting and write your pages, or add an item there.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {m.meeting.agenda.map((a) => (
                      <li key={a.text} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          className="size-4"
                          checked={a.done}
                          aria-label={`${a.done ? "Not done" : "Done"}: ${a.text}`}
                          onChange={(e) => {
                            void tickAgenda(m.path, a.text, e.target.checked);
                          }}
                        />
                        <span className={cn(a.done && "text-muted-foreground")}>{a.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
            {parts.actions && (
              <section aria-label="Actions" className="rounded-xl border bg-card p-4">
                <h3 className="section-label pb-1">Actions · become tasks</h3>
                {fromMeeting.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    None. A task you write in the page shows here.
                  </p>
                ) : (
                  <ul>
                    {fromMeeting.map((t) => (
                      <TaskRow key={`${t.path}:${String(t.line)}`} task={t} showNote={false} />
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
