## Draw a diagram yourself (Mermaid)

You do not need the AI to make a diagram. A diagram is a block of text in a page, and Nexmio Work draws it while the cursor is somewhere else. Click the picture to edit the text again.

**How to start:** write three backticks and the word `mermaid`, then the diagram, then three backticks. Copy one of the examples below and change the words. If something is wrong, the picture says what and shows the code, so you can fix it.

### A flow (flowchart)

`TD` is top to bottom, `LR` is left to right. A box is `[text]`, a question is `{text}`, and `-->` is an arrow. A word on an arrow goes between `--` and `-->`.

````
```mermaid
flowchart TD
  A[Idea] --> B{Worth it?}
  B -- yes --> C[Make an epic]
  B -- no --> D[Park it]
```
````

### A talk between people or parts (sequence)

````
```mermaid
sequenceDiagram
  Anna->>Ben: Can you look at the plan?
  Ben-->>Anna: Yes, tomorrow.
```
````

### The steps a thing goes through (state)

````
```mermaid
stateDiagram-v2
  [*] --> Todo
  Todo --> Doing
  Doing --> Done
  Doing --> Waiting
  Waiting --> Doing
  Done --> [*]
```
````

### A timeline of events

````
```mermaid
timeline
  title The project
  January : Idea
  March : First version
  June : Release
```
````

### A schedule (Gantt)

````
```mermaid
gantt
  title Plan
  dateFormat YYYY-MM-DD
  section Build
  Design : 2026-01-05, 10d
  Make it : 2026-01-15, 20d
```
````

### Shares of a whole (pie)

````
```mermaid
pie title Where the time goes
  "Writing" : 50
  "Meetings" : 30
  "Other" : 20
```
````

### A mind map

````
```mermaid
mindmap
  root((The trip))
    Travel
      Train
      Hotel
    Things to see
```
````

### Tips

- Start with a few boxes and add more. Give each box a short name.
- Use quotes round a text with special signs: `A["Cost (DKK)"]`.
- Indent with two spaces. A line that starts with `%%` is a comment.
- A diagram is plain Markdown: GitHub and other tools draw it too.

### More to learn

Mermaid has a short guide and a page for every kind of diagram, with many more examples:

- Start here: https://mermaid.js.org/intro/
- All kinds of diagrams and their text: https://mermaid.js.org/syntax/flowchart.html (the list is in the menu on the left)
- Try a diagram in your browser: https://mermaid.live
