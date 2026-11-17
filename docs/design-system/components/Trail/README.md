# Trail

A small line above a task, an epic or a plan that shows where it belongs, for example **Office move › Plan › Tell the neighbours**. It is the thread of Think it, Plan it, Do it and Keep it written as a path.

- Every step with a place to go is a `primary` text button (a link); the step you are at is `foreground` text with `aria-current="page"`.
- Steps are separated by a small chevron. The line is `small` (12px), sits under the `ViewHeader` with a bottom border and the `space-5` gutter, and wraps on a narrow window.
- It shows nothing when there is only one step.
- Use `Trail` from `src/components/Trail.tsx`; the steps of an epic or a task come from `epicTrail` in the Tasks area.
