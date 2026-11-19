# TagPicker

The tags of a task, an epic or anything else that has them, with a small field to add one.

- A tag is a pill (`radius-full`, `small` 12px): the tags the thing has itself are `accent` with a cross that takes one off (`aria-label` "Take the tag … off"); a tag it gets from something around it (a task from its epic) is dashed, `muted-foreground`, with no cross and a tooltip "From the epic".
- **Add a tag** (a dashed pill with a plus and the words) opens a field. Enter adds the tag, Esc closes the field. The tags the vault already uses are offered below the field as pills (most used first, with how many pages have them), because they are the same tags on pages everywhere.
- A tag is one word: lower case, letters, digits, `-` and `_`, with a letter in it. Anything else shows a short message and is not added.

Use `TagPicker` from `src/components/TagPicker.tsx`. The tags of a task and an epic come from `TaskTags` and `EpicTags` in the Tasks area.
