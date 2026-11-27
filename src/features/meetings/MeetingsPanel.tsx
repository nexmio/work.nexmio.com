import { CalendarDays, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MonthCalendar } from "@/components/MonthCalendar";
import { PanelHeader } from "@/components/PanelHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  groupMeetings,
  meetingDays,
  meetingsOn,
  whenLabel,
  type MeetingNote,
} from "@/lib/meetingList";
import { shortDate, todayIso } from "@/lib/taskLogic";
import { cn } from "@/lib/utils";
import { useMeetingStore } from "@/stores/meetingStore";
import { useMeetingsLoaded, useShownMeeting } from "./useMeetings";
import { useUiStore } from "@/stores/uiStore";
import { PlainButton } from "@/components/ui/plain-button";

/** How many earlier meetings are listed before "Show more". */
const PAST_SHOWN = 20;

/** Whether a meeting matches what was typed in the search box (title or people). */
function matches(m: MeetingNote, q: string): boolean {
  if (q === "") return true;
  return [m.meeting.title, ...m.meeting.people].some((x) => x.toLowerCase().includes(q));
}

function MeetingRow({ m, today, shown }: { m: MeetingNote; today: string; shown: boolean }) {
  const format = useUiStore((s) => s.timeFormat);
  return (
    <li>
      <PlainButton
        type="button"
        aria-current={shown}
        title={m.path}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
          shown && "bg-accent text-accent-foreground",
        )}
        onClick={() => {
          useMeetingStore.getState().select(m.path);
          useUiStore.getState().setCenterView("meetings");
        }}
      >
        <span className="min-w-16 shrink-0 whitespace-nowrap text-xs text-muted-foreground tabular-nums">
          {whenLabel(m.meeting, today, format)}
        </span>
        <span className="min-w-0 flex-1 truncate">{m.meeting.title}</span>
      </PlainButton>
    </li>
  );
}

/**
 * The left panel of the Meetings area: a calendar with a dot on the days that have a meeting, then
 * today (the daily note and the day's meetings), the ones to come and the ones that are over. A
 * click on a day shows only that day. A click on a meeting opens it in the middle.
 */
export function MeetingsPanel() {
  const meetings = useMeetingStore((s) => s.meetings);
  const loaded = useMeetingStore((s) => s.loaded);
  const day = useMeetingStore((s) => s.day);
  const decisions = useMeetingStore((s) => s.decisions);
  const centerView = useUiStore((s) => s.centerView);
  const shownMeeting = useShownMeeting();
  const [allPast, setAllPast] = useState(false);
  const [calendar, setCalendar] = useState(false);
  const [filter, setFilter] = useState("");
  useMeetingsLoaded();

  const today = todayIso();
  const query = filter.trim().toLowerCase();
  const groups = useMemo(
    () =>
      groupMeetings(
        meetings.filter((m) => matches(m, query)),
        today,
      ),
    [meetings, today, query],
  );
  const days = useMemo(() => meetingDays(meetings), [meetings]);
  const shown = centerView === "meetings" ? shownMeeting?.path : undefined;

  const rows = (list: MeetingNote[]) =>
    list.map((m) => <MeetingRow key={m.path} m={m} today={today} shown={shown === m.path} />);
  const heading = (text: string, extra?: React.ReactNode) => (
    <div className="flex items-center px-2 pb-1 pt-3">
      <h3 className="section-label flex-1">{text}</h3>
      {extra}
    </div>
  );
  const past = allPast ? groups.past : groups.past.slice(0, PAST_SHOWN);
  const monthName = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title="Meetings">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            useUiStore.getState().setMeetingFormOpen(true);
          }}
        >
          <Plus /> New meeting
        </Button>
      </PanelHeader>
      <div className="min-h-0 flex-1 overflow-auto pb-3 pt-2">
        <div
          role="group"
          aria-label="Show"
          className="mx-2 mb-2 flex overflow-hidden rounded-md border text-sm"
        >
          {[
            {
              on: !decisions,
              label: "Meetings",
              run: () => useMeetingStore.getState().showDecisions(false),
            },
            {
              on: decisions,
              label: "Decisions",
              run: () => useMeetingStore.getState().showDecisions(true),
            },
          ].map((b, i) => (
            <PlainButton
              key={b.label}
              type="button"
              aria-pressed={b.on}
              className={cn(
                "flex-1 py-1",
                i > 0 && "border-l",
                b.on ? "bg-accent font-semibold text-accent-foreground" : "hover:bg-muted",
              )}
              onClick={b.run}
            >
              {b.label}
            </PlainButton>
          ))}
        </div>
        <div className="px-2 pb-1">
          <PlainButton
            type="button"
            aria-expanded={calendar}
            className="flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              setCalendar(!calendar);
            }}
          >
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">{monthName}</span>
            <span className="text-xs text-muted-foreground">{calendar ? "hide" : "show"}</span>
          </PlainButton>
        </div>
        {(calendar || day !== null) && (
          <MonthCalendar
            dots={days}
            dotLabel="has a meeting"
            selected={day}
            todayTitle="Show today"
            onPick={(iso) => {
              useMeetingStore.getState().setDay(iso === todayIso() ? null : iso);
            }}
          />
        )}
        <div className="px-2 pb-1">
          <Input
            aria-label="Search meetings"
            placeholder="Search meetings"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
            }}
          />
        </div>
        <div className="px-2">
          {day !== null ? (
            <>
              {heading(
                shortDate(day),
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6"
                  aria-label="Show every day again"
                  onClick={() => {
                    useMeetingStore.getState().setDay(null);
                  }}
                >
                  <X />
                </Button>,
              )}
              <ul>{rows(meetingsOn(meetings, day))}</ul>
              {meetingsOn(meetings, day).length === 0 && (
                <p className="px-2 py-2 text-xs text-muted-foreground">No meetings that day.</p>
              )}
            </>
          ) : (
            <>
              {heading("Today")}
              <ul>{rows(groups.today)}</ul>
              {loaded && groups.today.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">No meetings today.</p>
              )}
              {groups.upcoming.length > 0 && (
                <>
                  {heading("Coming")}
                  <ul>{rows(groups.upcoming)}</ul>
                </>
              )}
              {groups.past.length > 0 && (
                <>
                  {heading("Earlier")}
                  <ul>{rows(past)}</ul>
                  {groups.past.length > PAST_SHOWN && (
                    <PlainButton
                      type="button"
                      className="w-full rounded-md px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => {
                        setAllPast(!allPast);
                      }}
                    >
                      {allPast
                        ? "Show fewer"
                        : `Show more (${String(groups.past.length - PAST_SHOWN)})`}
                    </PlainButton>
                  )}
                </>
              )}
              {groups.undated.length > 0 && (
                <>
                  {heading("No date")}
                  <ul>{rows(groups.undated)}</ul>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
