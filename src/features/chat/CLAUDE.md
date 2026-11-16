# AI

Everything the AI does for pages: the chat ("Ask about my pages"), the fixed commands on selected text (`inlineAi`), in any text box (`fieldAi`), on a page, a folder, search, tasks and ideas, skills carried out page by page, proposals and their review (`proposals`), projects with AI instructions (`projects`). Rust: `src-tauri/src/ai/` (router, prompts, tools, agent, inline, proposals, providers), `chats/`, `skills/`, `projects/`.

- `ai::router::select_notes` is the only way to a provider. Pages go to a local AI, or to a cloud AI only after `ai.cloudConsent`, never in a Local AI only project.
- The AI tab of the right panel has two parts: **Chat** and **Queue**. A command on selected text in a page is put in the queue (`stores/aiJobStore.ts`), runs one at a time in the background, and its result is accepted in the Queue, which opens the page and writes it (`findSpot` finds the text again; a changed text is never overwritten). Text boxes outside pages (`fieldAi`) still answer in their own popup.
- The AI never writes: every change is a proposal the person accepts (snapshot commit before, commit after).
- A command does one fixed thing and its output is only the result (no "Here is…"); clean it (`ai/clean.rs`) before it is shown.
