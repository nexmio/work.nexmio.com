import { Diamond } from "lucide-react";
import { useState } from "react";
import { ViewHeader } from "@/components/ViewHeader";
import { Input } from "@/components/ui/input";
import { PlainButton } from "@/components/ui/plain-button";
import { Select } from "@/components/ui/select";
import { shortDate } from "@/lib/taskLogic";
import { useMeetingStore } from "@/stores/meetingStore";
import { useVaultStore } from "@/stores/vaultStore";
import { decisionGroups } from "./decisions";

/**
 * The Decisions of the Meetings area: every decision written in a meeting, grouped by project and
 * the newest first, with a project to show and a search. A line opens its meeting. Nothing is
 * stored apart: they are read from the meetings' Decisions.
 */
export function DecisionsView() {
  const meetings = useMeetingStore((s) => s.meetings);
  const projects = useVaultStore((s) => s.projects);
  const [project, setProject] = useState("");
  const [query, setQuery] = useState("");
  const groups = decisionGroups(meetings, projects, project === "" ? null : project, query);

  return (
    <section aria-label="Decisions" className="flex h-full min-h-0 flex-col bg-background">
      <ViewHeader title="Decisions" />
      <div className="min-h-0 flex-1 overflow-auto px-7 py-5">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {projects.length > 0 && (
              <Select
                aria-label="Show"
                className="w-56"
                value={project}
                onChange={(e) => {
                  setProject(e.target.value);
                }}
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="none">No project</option>
              </Select>
            )}
            <Input
              aria-label="Search decisions"
              placeholder="Search decisions"
              className="max-w-xs"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
          </div>
          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {query.trim() !== "" || project !== ""
                ? "No decision matches."
                : "No decisions yet. A decision written in a meeting shows here."}
            </p>
          )}
          {groups.map((g) => (
            <section
              key={g.project?.id ?? "none"}
              aria-label={g.project?.name ?? "No project"}
              className="flex flex-col gap-1"
            >
              <h3 className="section-label px-1">{g.project?.name ?? "No project"}</h3>
              <ul className="rounded-xl border bg-card p-1">
                {g.decisions.map((d) => (
                  <li key={`${d.meeting.path}:${d.text}`}>
                    <PlainButton
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => {
                        const store = useMeetingStore.getState();
                        store.showDecisions(false);
                        store.select(d.meeting.path);
                      }}
                    >
                      <Diamond className="size-3.5 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1">{d.text}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {d.meeting.meeting.title}
                        {d.meeting.meeting.date === null
                          ? ""
                          : ` · ${shortDate(d.meeting.meeting.date)}`}
                      </span>
                    </PlainButton>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
