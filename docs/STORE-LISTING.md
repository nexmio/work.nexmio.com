# Microsoft Store listing: texts and files to paste into Partner Center

Use this together with [docs/MSIX.md](MSIX.md). Everything below is in English, because the app is. Partner Center shows the exact size and length limits for each field, so trust it over this page if they differ.

## What the release sends by itself

Every release sends these fields to both Store products: the description, short description and search terms below; "What's new" from `CHANGELOG.md`; the notes for certification and the runFullTrust reason below; and the fixed fields in `docs/store/store-fields.json` (copyright and trademark, developed by, website, privacy policy, support contact, features, hardware). Change the text here or in that file and it goes out with the next release. Pictures, price, markets, visibility, category and age rating are **not** touched: they stay as they were set in Partner Center. A Preview product that is not hidden is never updated (the script stops).

## Files

| What                      | File                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App icon, 1:1, 300 × 300  | `docs/store/icon-300x300.png`                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Box art, 1:1, 1080 × 1080 | `docs/store/box-art-1080x1080.png`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Screenshots               | `docs/screenshots/` (1920 × 1080, taken from a demo vault in a headless browser, never from real pages). The Store wants at least 1366 × 768 and accepts up to ten: `start-page.png`, `note-editor.png`, `tasks.png`, `task-page.png`, `focus.png`, `meeting.png`, `tags.png`, `themes.png`, `midnight.png`, `ideas.png`. They are the same pictures the README shows. They show no AI result, because that needs a running AI; take one of the AI review yourself on a demo vault if you want one. |
| The package               | The artifact `nexmio-work-msix` (unsigned) from the release run                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Product identity and name

- **Name:** Nexmio Work (reserved). A second product, **Nexmio Work Preview** (reserved), has the same texts with one sentence added at the top of the description. The release workflow sends the description, the search terms and "What's new" to both at every release (see `docs/RELEASING.md`); the rest is set once in Partner Center.
- **Category:** Productivity (sub-category: Pages, if offered)

## Short description

Markdown pages with an AI assistant that runs on your own computer. Plain files, a Git history of every change, and an AI that only proposes.

## Description

Nexmio Work is a pages app for people who want to own their pages. Your pages are ordinary Markdown files in ordinary folders, so they work in any other editor too. Every change is saved in a built-in version history, so nothing is ever lost.

**Pages, tasks and ideas in one place**

- A live-preview Markdown editor with a toolbar, tabs, split view and a table editor. Mermaid diagrams are drawn right in the page.
- Tasks are plain checklist lines in your pages, with steps, a page and a log. Epics group them in one outline you can fold, and move to Done when every task is done. A task made from a page gets an epic of its own that points back to the page.
- Plans: break something big into parts, as an outline or a map, and tie a part to a task, a page or an epic.
- An ideas list, and a Focus view that shows one task at a time.
- Landing keeps Meetings, Quick pages and Tasks together, with a mark on new pages and a button to move them where they belong.
- Daily pages in a calendar at the top of the file panel. Wiki-links, tags (typing # suggests the ones you already use), images and index pages.
- Full-text search, and search by meaning with a local embedding model.
- Export to HTML, Word and PDF. Import from a folder of Markdown files, for example a OneNote export.

**AI where you work, and only if you want it**

- Select text for quick changes: fix spelling, rewrite, shorten and more. The AI can also point out spelling mistakes as you type, in the language of the text.
- Ready-made commands above each page, on folders, on search answers, on tasks and on ideas: summarise, find a title and tags, suggest the next steps, think an idea through. You review every change before it is written.
- A plain chat to ask about your pages, where you can point at pages or folders with /.
- Skills: ready-made jobs such as fixing spelling, tidying the structure or sorting a folder. Nexmio Work checks every change (links, tags, numbers and dates).
- Your pages are only ever sent to an AI that runs on your own computer: the built-in AI (Microsoft's Foundry Local, which can use a neural processor) or LM Studio.
- Everything else works the same without any AI.

**Safe by design**

- Every vault is a local Git repository: compare, restore and recover deleted pages.
- No account, no telemetry, no ads.
- Free to use and change (Apache-2.0 with the Commons Clause): https://github.com/nexmio/work.nexmio.com

**Live generative AI.** Nexmio Work shows answers that an AI model writes in response to what you type. The model runs on your own computer. You can report inappropriate AI content from inside the app: Help → Report inappropriate AI content.

Nexmio Work is a beta version. The app is in English; the assistant answers in the language you write in.

## What's new in this version

Nexmio Work 0.25: a new purple look, and the AI is simply called the AI. AI commands on selected text now run in the background: add several, keep working, and accept each answer from the Queue tab of the AI. Plans have a better map (arrange the parts, drag, zoom) and a start-page widget, and meetings can write an agenda point into the pages. A new layout: names beside the icons, search at the top, the chat beside the page, tasks one epic at a time, ideas as cards, and settings that apply at once. Settings start fresh.

## Search terms (up to seven)

markdown, pages, page taking, local ai, git history, wiki links, knowledge base

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
- **Age rating:** answer the questionnaire honestly. Nexmio Work has no violent, sexual or gambling content of its own. Note that it lets the user chat with an AI model that the user chooses, so the "user-generated content / online interaction" questions may apply: the chat is private and goes only to the AI on the user's own computer.

## Notes for certification (paste into "Notes for certification")

```
Nexmio Work is a desktop pages app with open source code (Tauri, Rust and a WebView2 front end), packaged as a full-trust desktop app.

How to try it: start the app, choose "Open folder as vault" and pick or create any empty folder. Create a page with Ctrl+N. No account or sign-in is needed.

The AI features use either the optional built-in AI (Foundry Local, see below) or a local AI server (LM Studio) that is not part of the package. Without either, the app is a normal Markdown editor with version history. No data is sent anywhere.

The app shows AI-generated answers (live generative AI). The model is one the user connects themselves. To report inappropriate AI content, use Help > "Report inappropriate AI content…": it opens a pre-filled issue on the developer's GitHub page, and reports are read and acted on.

Built-in AI: the package contains Microsoft's Foundry Local runtime (MIT-licensed SDK and native libraries). It runs in a helper process, which is the same nexmio-work.exe started with the argument --foundry-helper; no other program is started. If the user opens Settings > Built-in AI and presses Download, the runtime fetches (1) the hardware components for the neural processor or graphics card, and (2) a model chosen by the user, from Microsoft's Foundry Local catalog. Nothing is downloaded unless the user presses the button, and the screen says what will be downloaded before that. Only data is downloaded, no programs. The app works fully without it. The llama.cpp engine that the GitHub installer offers is disabled in this build.

The app does not collect any data. Privacy policy: https://work.nexmio.com/privacy.html
```

## Why the app needs "runFullTrust" (if asked)

```
Nexmio Work is a classic desktop application (Tauri/Rust with a WebView2 front end), packaged with the desktop bridge. It needs full trust for these things, which a sandboxed UWP app cannot do:

1. It reads and writes the Markdown files and the Git repositories (the version history) in folders that the user opens anywhere on their disk, for example Documents or a synced folder, and it watches those folders for changes made by other programs.
2. It can make a backup copy of a vault in another folder the user chooses, for example on an external disk.
3. It talks to an AI server on the user's own computer (for example LM Studio on localhost) and, for the built-in AI, runs Microsoft's Foundry Local runtime in a helper process. The helper is the same nexmio-work.exe started with the argument --foundry-helper. No other program is started.

The app has no account, no telemetry and no background service, and it sends nothing from the user's pages anywhere. The source code is public: https://github.com/nexmio/work.nexmio.com
```

## Required for apps with AI content (Store policy 11.16, "Live Generative AI Content")

Microsoft's policy says a product that contains content that a generative AI model creates in response to user input must do four things. Nexmio Work does:

1. **Disclose it in the metadata**: the paragraph "Live generative AI." in the description above. Keep it.
2. **Page it in Partner Center** during the submission: tick the box or answer the question that says the product uses live generative AI.
3. **Follow the other Store policies**: the user chooses the model, and every change the AI proposes is shown for review before anything is written.
4. **Give users a way to report inappropriate content to the developer**: **Help → Report inappropriate AI content…** opens a pre-filled issue at https://github.com/nexmio/work.nexmio.com/issues. Read the reports there and act on them. Say in the certification pages where the menu item is.

## Things Microsoft may ask about

- **AI content:** see the four points above. The package contains no AI model. The user downloads one (built-in AI) or connects a local AI of their choice.
- **WebView2:** Windows 11 includes it. On Windows 10 the Edge WebView2 runtime may have to be installed.
- If the review is rejected, read the message, fix the cause, and submit a new package: the version number must be higher each time.
