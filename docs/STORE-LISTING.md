# Microsoft Store listing: texts and files to paste into Partner Center

Use this together with [docs/MSIX.md](MSIX.md). Everything below is in English, because the app is. Partner Center shows the exact size and length limits for each field, so trust it over this page if they differ.

## What the release makes for the Store

Nothing is sent to the Store for now: the package and the texts are uploaded in Partner Center by hand. What has changed since the last upload is listed in [STORE-CHANGES.md](STORE-CHANGES.md). Every release makes these fields for both Store products (the artifact `release-texts` of the release run has them as files): the description, short description and search terms below; "What's new" from `CHANGELOG.md`; the notes for certification and the runFullTrust reason below; and the fixed fields in `docs/store/store-fields.json` (copyright and trademark, developed by, website, privacy policy, support contact, features, hardware). Change the text here or in that file and the next release has it. The pictures (ten screenshots, the icon and the box art) are uploaded by hand too. Price, markets, visibility, category and age rating are kept in Partner Center from the last submission.

## Files

| What                      | File                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App icon, 1:1, 300 × 300  | `docs/store/icon-300x300.png`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Box art, 1:1, 1080 × 1080 | `docs/store/box-art-1080x1080.png`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Screenshots               | `docs/screenshots/` (1920 × 1080, taken from a demo vault in a headless browser, never from real pages). The Store wants at least 1366 × 768 and accepts up to ten. Use these, in this order: `start-page.png`, `projects.png`, `project-overview.png`, `look-back.png`, `ai-box.png`, `tasks.png`, `note-editor.png`, `meeting.png`, `task-page.png`, `themes.png`. The others (`timer.png`, `tags.png`, `ideas.png`, `midnight.png`) are for the README and the website. They are the same pictures the README shows. They show no AI result, because that needs a running AI; take one of the AI review yourself on a demo vault if you want one. |
| The package               | The artifact `nexmio-work-msix` (unsigned) from the release run                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Product identity and name

- **Name:** Nexmio Work (reserved). A second product, **Nexmio Work Preview** (reserved), has the same texts with one sentence added at the top of the description. The description, the search terms and "What's new" are entered by hand for both when they change (see `docs/RELEASING.md`).
- **Category:** Productivity

## Short description

Markdown pages with an AI assistant that runs on your own computer. Plain files, a Git history of every change, and an AI that only proposes.

## Description

Requires 64-bit Windows 10 (version 1809 or later) or Windows 11, with the Microsoft Edge WebView2 runtime (part of Windows 11). The AI is optional: the built-in AI needs a model download of about 3 to 15 GB and 6 to 24 GB of memory, depending on the model.

Nexmio Work is a pages app for people who want to own their pages. Your pages are ordinary Markdown files in ordinary folders, so they work in any other editor too. Every change is saved in a built-in version history, so nothing is ever lost.

**Pages, tasks and ideas in one place**

- A live-preview Markdown editor with a toolbar, tabs, split view and a table editor. Mermaid diagrams are drawn right in the page.
- Tasks are plain checklist lines in your pages, with steps, a page and a log. Epics group them in one outline you can fold, and move to Done when every task is done. A task made from a page gets an epic of its own that points back to the page.
- Projects and plans: a project is a folder with its own notes for the AI. A plan always lives in a project: break it into parts, as a map or an outline, and tie a part to a task or a page. An overview shows how far the project has come, what to do now, what waits, and its meetings and decisions. A project can wait for its plan until you have gathered enough to make one, and the same task can be made for several people at once.
- An ideas list, a timer beside the page that writes the time on a task in its log, and an overview of the time per tag and task.
- The Inbox keeps Meetings, Tasks and pages made from ideas together, with a mark on new pages and a button to move them where they belong.
- Daily pages in a calendar at the top of the file panel. Wiki-links, tags (typing # suggests the ones you already use), images and index pages.
- Full-text search. Search by meaning is optional and needs an embedding model in an AI server of your own on your computer (for example LM Studio); the built-in AI cannot do it.
- Export to HTML, Word and PDF. Import from a folder of Markdown files, for example a OneNote export.

**AI where you work, and only if you want it**

- Select text for quick changes: fix spelling, rewrite, shorten and more. The AI can also point out spelling mistakes as you type, in the language of the text.
- Ready-made commands above each page, on folders, on search answers, on tasks and on ideas: summarise, find a title and tags, suggest the next steps, think an idea through. You review every change before it is written.
- An AI box over the right side of the window, wherever you are. Ask what to do next or what you are waiting for: it reads your tasks, projects and meetings, answers how-to questions from the help, and can suggest tasks and parts of a plan for you to accept. Point at pages or folders with /.
- Look back on your week: what you finished, the time you logged, your meetings and the pages you wrote, as a status report you can copy or let the AI write.
- Skills: ready-made jobs such as fixing spelling, tidying the structure or sorting a folder. Nexmio Work checks every change (links, tags, numbers and dates).
- The AI runs on your own computer: the built-in AI (llama.cpp comes with the app, and you download a Gemma 4 model once in Settings) or an AI server of your own, such as LM Studio. A cloud AI can be turned on, after a warning that your pages are then sent to it.
- Everything else works the same without any AI.

**Safe by design**

- Every vault is a local Git repository: compare, restore and recover deleted pages.
- No account, no telemetry, no ads.
- Free to use and change (Apache-2.0 with the Commons Clause): https://github.com/nexmio/work.nexmio.com

**Live generative AI.** Nexmio Work shows answers that an AI model writes in response to what you type. By default the model runs on your own computer; it is a cloud AI only if you turn one on. You can report inappropriate AI content from inside the app: Help → Report inappropriate AI content (it opens a report on the developer's GitHub page).

Nexmio Work is a beta version. The app is in English; the assistant answers in the language you write in.

## What's new in this version

Made from the `CHANGELOG.md` section of the version at every release (`store-notes.txt` in the artifact `release-texts`). Nothing to write here.

## Search terms (up to seven)

markdown, markdown editor, tasks, local ai, git history, wiki links, knowledge base

## Links and contact

- **Privacy policy URL:** https://work.nexmio.com/privacy.html
- **Website:** https://work.nexmio.com
- **Support contact:** https://github.com/nexmio/work.nexmio.com/issues (add an e-mail address if Partner Center requires one)
- **Copyright and trademark info:** © 2026 Jesper Ahasverusen Kielsgaard

## Pricing and availability

- **Price:** Free.
- **Visibility:** to keep it out of the public search at first, choose "Hide this product in the Store, but make it available by direct link".
- **Markets:** all, or only the ones you want.

## Properties and age rating

- **Category:** Productivity.
- **System requirements:** Windows 10 version 1809 or later (Windows 11 recommended: it includes the WebView2 runtime that Nexmio Work uses). 64-bit.
- **Age rating:** answer the questionnaire honestly. Nexmio Work has no violent, sexual or gambling content of its own. It lets the user chat with an AI model: by default one on the user's own computer, and a cloud AI if the user turns one on. Answer the questions about AI content and online interaction with both in mind. Nothing a user writes is shown to other users.

## Notes for certification (paste into "Notes for certification")

```
Nexmio Work is a desktop pages app (Tauri: Rust and a WebView2 front end), packaged as a full-trust desktop app. Source code: https://github.com/nexmio/work.nexmio.com

To try it: start the app, choose "Open folder as vault" and pick any empty folder. Ctrl+N makes a page. No account is needed.

Built-in AI (optional): the llama.cpp server (llama-server, MIT licence) is part of the package. Only when the user presses Download in Settings > AI, the app downloads a model file (Gemma 4, about 3 to 15 GB; data, not code) from huggingface.co, checks it, and runs llama-server on 127.0.0.1 with a random key. The user can instead use an AI server of their own. A cloud AI is off until the user turns it on and agrees to a warning. No API key is needed; one is optional for a server that asks for it. Without AI the app is a Markdown editor with version history.

Live generative AI: report inappropriate content with Help > "Report inappropriate AI content…". It opens a pre-filled issue on the developer's GitHub page; reports are read and acted on.

The developer collects no data. Privacy policy: https://work.nexmio.com/privacy.html
```

## Why the app needs "runFullTrust" (if asked)

```
A classic desktop app that: (1) reads, writes and watches Markdown files and Git repositories in folders the user opens anywhere on disk; (2) backs a vault up to a folder the user chooses; (3) starts the included llama-server as a local process, or talks to an AI server on the same computer. No account, telemetry or background service. Page text leaves the computer only if the user turns on a cloud AI.
```

## Required for apps with AI content (Store policy 11.16, "Live Generative AI Content")

Microsoft's policy says a product that contains content that a generative AI model creates in response to user input must do four things. Nexmio Work does:

1. **Disclose it in the metadata**: the paragraph "Live generative AI." in the description above. Keep it.
2. **Declare it in Partner Center** during the submission: tick the box or answer the question that says the product uses live generative AI.
3. **Follow the other Store policies**: the AI is chosen by the user, and every change the AI proposes is shown for review before anything is written.
4. **Give users a way to report inappropriate content to the developer**: **Help → Report inappropriate AI content…** opens a pre-filled issue at https://github.com/nexmio/work.nexmio.com/issues. Read the reports there and act on them. Say in the certification pages where the menu item is.

## Things Microsoft may ask about

- **AI content:** see the four points above. The package contains the AI engine but no AI model. The user downloads a model (built-in AI) or connects an AI of their choice.
- **WebView2:** Windows 11 includes it. On Windows 10 the Edge WebView2 runtime may have to be installed.
- If the review is rejected, read the message, fix the cause, and submit a new package: the version number must be higher each time.
