import { describe, expect, it } from "vitest";
import { makeTask } from "@/test/taskFixtures";
import {
  clockText,
  formatDuration,
  minutesBetween,
  parseTimeLine,
  taskMinutes,
  timeEntriesOf,
  timeLogText,
} from "./timeLog";

const at = (h: number, m: number): number => new Date(2026, 10, 18, h, m).getTime();

describe("time on a task, written in its log", () => {
  it("writes a duration in hours and minutes", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(80)).toBe("1 h 20 min");
    expect(formatDuration(120)).toBe("2 h");
    expect(formatDuration(65)).toBe("1 h 05 min");
    expect(formatDuration(0)).toBe("1 min");
  });

  it("shows the clock of a running timer", () => {
    expect(clockText(0)).toBe("00:00:00");
    expect(clockText(42 * 60_000 + 10_000)).toBe("00:42:10");
    expect(clockText(3_725_000)).toBe("01:02:05");
  });

  it("counts whole minutes between two moments, and never fewer than one", () => {
    expect(minutesBetween(at(9, 0), at(10, 20))).toBe(80);
    expect(minutesBetween(at(9, 0), at(9, 0) + 5_000)).toBe(1);
  });

  it("writes the log line and reads the same thing back", () => {
    const text = timeLogText({
      minutes: 80,
      from: at(9, 0),
      to: at(10, 20),
      note: "  Called   Anna ",
    });
    expect(text).toBe("⏱ 1 h 20 min · 09:00–10:20 · Called Anna");
    expect(parseTimeLine(text)).toEqual({ minutes: 80, span: "09:00–10:20", note: "Called Anna" });
  });

  it("reads lines without times or a note, and refuses lines that are not time", () => {
    expect(parseTimeLine("⏱ 45 min")).toEqual({ minutes: 45, span: null, note: "" });
    expect(parseTimeLine("⏱ 2 h · by hand")).toEqual({ minutes: 120, span: null, note: "by hand" });
    expect(parseTimeLine("Left off: next is the offer")).toBeNull();
    expect(parseTimeLine("⏱ soon")).toBeNull();
    expect(parseTimeLine("⏱ 0 min")).toBeNull();
  });

  it("adds up the time lines of a task and ignores the other log lines", () => {
    const task = makeTask({
      log: [
        { line: 7, date: "2026-11-12", text: "⏱ 2 h 40 min · 09:00–11:40", key: "1" },
        { line: 8, date: "2026-11-13", text: "Sent the outline", key: "2" },
        { line: 9, date: "2026-11-14", text: "⏱ 3 h 30 min", key: "3" },
      ],
    });
    expect(timeEntriesOf(task).map((e) => e.date)).toEqual(["2026-11-12", "2026-11-14"]);
    expect(taskMinutes(task)).toBe(6 * 60 + 10);
  });
});

describe("periods and the CSV of the time overview", () => {
  const now = new Date(2026, 10, 18); // Wednesday 18 November 2026

  it("gives the first and last day of a period", async () => {
    const { periodRange } = await import("./timeLog");
    expect(periodRange("week", now)).toEqual(["2026-11-16", "2026-11-22"]);
    expect(periodRange("month", now)).toEqual(["2026-11-01", "2026-11-30"]);
    expect(periodRange("last-month", now)).toEqual(["2026-10-01", "2026-10-31"]);
    expect(periodRange("year", now)).toEqual(["2026-01-01", "2026-12-31"]);
    expect(periodRange("all", now)).toBeNull();
  });

  it("keeps the entries inside a period, both ends included", async () => {
    const { entriesIn } = await import("./timeLog");
    const rows = [
      { date: "2026-10-31" },
      { date: "2026-11-01" },
      { date: "2026-11-30" },
      { date: "2026-12-01" },
    ];
    expect(entriesIn(rows, ["2026-11-01", "2026-11-30"])).toEqual([rows[1], rows[2]]);
    expect(entriesIn(rows, null)).toHaveLength(4);
  });

  it("writes CSV with quotes where a cell needs them", async () => {
    const { timeCsv } = await import("./timeLog");
    const csv = timeCsv([
      {
        date: "2026-11-12",
        task: "Draft, then send",
        epic: "Acme",
        tags: "#kunde-x",
        span: "09:00–11:40",
        minutes: 160,
        note: 'He said "yes"',
      },
    ]);
    expect(csv.split("\n")).toEqual([
      "Date,Task,Epic,Tags,Time of day,Minutes,Note",
      '2026-11-12,"Draft, then send",Acme,#kunde-x,09:00–11:40,160,"He said ""yes"""',
    ]);
  });
});
