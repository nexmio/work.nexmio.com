# Meetings

A meeting is a page with the tag `meeting` and the properties `meeting: YYYY-MM-DD HH:MM` and `with: [..]`; `parts: [agenda, decisions, actions]` says which parts it has (none written = all three, for a meeting made before the parts; a new meeting has none until they are ticked); `## Agenda` holds `- [ ]` items, `## Notes` is one text for the whole meeting, `## Decisions` holds `- ` lines and `## Actions` holds tasks (`src/lib/meeting.ts`). The Meetings area (a calendar folded to one line, a search box, Today/Coming/Earlier/No date, the meeting page in two columns), the meeting form, the meeting screen (`MeetingFocus`), Start meeting and Prepare next, and the next-meeting line in Landing.

- Nothing is stored apart from the page: every list is read from the tagged pages (`tagged_notes`, `meetingStore`, one read at a time).
- Changing a meeting changes only its properties (`setMeetingWhen`, `setMeetingParts`), never the body. A part switched off is hidden, its section stays.
- The agenda does not hold the pages: clicking an item only marks it "Now"; the small arrow pill on an item writes its text on a new line at the bottom of the pages. The pages of a meeting made before the parts existed keep their `### item` headings as plain text.
- The parts chosen for a new meeting are remembered per computer (`nexmio.meetingParts`).
- Times follow the time format setting (`formatTime`, `TimeInput`); the page always stores `HH:MM`.
