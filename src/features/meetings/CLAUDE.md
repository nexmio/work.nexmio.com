# Meetings

A meeting is a page with the tag `meeting` and the properties `meeting: YYYY-MM-DD HH:MM` and `with: [..]`; `parts: [agenda, decisions, actions]` says which parts it has (none written = all three, for a meeting made before the parts; a new meeting has none until they are ticked); `## Agenda` holds `- [ ]` items, `## Notes` is one text for the whole meeting, `## Decisions` holds `- ` lines and `## Actions` holds tasks (`src/lib/meeting.ts`). The Meetings area (a calendar folded to one line, a search box, Today/Coming/Earlier/No date, the meeting page in two columns), the meeting form, the meeting screen (`MeetingFocus`), Start meeting and Prepare next, and the next-meeting line in the Inbox (the Pages panel).

- Nothing is stored apart from the page: every list is read from the tagged pages (`tagged_notes`, `meetingStore`, one read at a time).
- Changing a meeting changes only its properties (`setMeetingWhen`, `setMeetingParts`), never the body. A part switched off is hidden, its section stays.
- The agenda does not hold the notes: clicking an item only marks it "Now"; the small arrow pill on an item writes its text on a new line at the bottom of the notes. The notes of a meeting made before the parts existed keep their `### item` headings as plain text.
- The meeting's text is called **Notes** everywhere a person reads it (`## Notes` in the file), never "pages".
- The parts chosen for a new meeting are remembered per computer (`nexmio.meetingParts`).
- A meeting belongs to a project by the project's tag in its properties (`Meeting.tags`, `projectOfMeeting`). Its actions can be moved to the plan's epic (`moveActions.ts`). **Decisions** (`DecisionsView`, `decisions.ts`) lists every decision, read from the meetings.
- Times follow the time format setting (`formatTime`, `TimeInput`); the page always stores `HH:MM`.
- The AI of a meeting (`meetingAi.ts`): **Decisions and actions from the notes** is one pick job in two groups; **Suggest an agenda** reads the meeting before with the same name. Both write only what was ticked.
