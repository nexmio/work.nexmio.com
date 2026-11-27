The AI only proposes. Nothing is written until you accept it.

1. **Select text** and choose Fix, Rewrite or Shorten.
2. For a question, press **AI** in the top bar (Ctrl/Cmd+L).
3. Look at the answer, then press **Accept**.

![The AI box over the right side](img/ai.png)

<!-- more -->

## The AI

**The AI** in Nexmio Work is a helper that runs on your computer. It is not one chat you have to type into: it is buttons where you work, and each one does one fixed thing. You never have to write a prompt.

**The AI only proposes changes. Nothing is written until you accept it.**

## AI where you work

- **Selected text:** the bar over the selection has **Fix**, **Rewrite** and **Shorten**, and **AI ▾** for more: rewrite with simpler words, more formal or friendlier (always the same meaning), make it a list, translate to Danish or English, **Explain this** (an answer next to the text, nothing changes), **Draw as a diagram** (a Mermaid diagram you can add under the text, or copy) and **Find tasks in it**. For a whole page, **AI → In short** gives its main points and the things to do: nothing is written to the page, and only the things you tick become tasks. You see the change before it is written, with a check that numbers, links and names are still there. **Ctrl/Cmd+K** opens the same menu.
- **The whole page:** the **AI** button above the page: fix spelling and grammar (in the whole page), improve the structure, a short summary at the top, a title and tags, find tasks, split into pages, and an e-mail from the page. **Link related pages** opens the Links panel; it finds pages by the title and tags and needs no AI.
- **A folder:** right-click it → **AI**: sort into folders, find duplicates, an index page and more. **Make an index page** right under it makes a list of links without AI.
- **Search:** a search that reads like a question ("what is the service desk number?") shows **Answer from my pages**. Press **Get an answer**: the AI reads the pages that fit and answers, with the pages it used.
- **A project, an epic, a meeting and the start page** have an **AI** button at the top, like the one above a page. In a project: **Find what is missing** (parts the plan may lack) and **Break down the chosen part**. In Tasks: **Break down a task** (the first you work on, else the first to do) and **Find tasks in the open page**. In a meeting: **Decisions and actions from the notes** (you tick which decisions and which actions to add), **Suggest an agenda** (from the meeting before with the same name and its open actions) and **In short**. Each also has a question for the chat, such as **Ask about this project**; the start page has **What should I do next?**, **What am I waiting for?** and **Write my status for this week**.
- **A task:** Break it down, **Write a status line from the log**.
- **An idea:** **Think it through** (three questions) and **Suggest first steps** (they become one task with those steps).
- **Any text box:** select text in a box (a task's note, the log, an idea, a project's text) and the same small bar appears, or press **Ctrl/Cmd+K** in the box. Name, search and password boxes have no AI.
- **Spelling help** (made for dyslexia): turn it on in the status bar or in Settings. A moment after you stop typing, misspelt words get a wavy line. Click a word to fix it, ignore it or add it to your words. Nothing changes by itself.

## When there is no AI

Everything that is not AI works as always: pages, search, tasks, ideas, the outline, links, history and images. The AI buttons are greyed out and say why (for example "No AI is set up" or "The built-in AI is not loaded"), with **Set up AI**. The system spellcheck still works.

## Ask about my pages

For a free question, press **Ctrl/Cmd+L**, or **AI** in the top bar. The AI opens as a box over the right side of the window, wherever you are (the start page, a page, a task), and what is under it stays as it was. **×** or **Esc** closes it, and the chat is kept. Type a question and press **Enter**, or press one of the questions an empty chat offers. Nexmio Work reads the open page (untick **Include the open page** for general questions) and searches your pages to answer. It also knows your work: the projects and how far their plans are, the tasks (what you work on, what waits and for whom), and the meetings with their decisions and open actions, so you can ask "What should I do next?" or "What did we decide about the van?". Ask how something is done in Nexmio Work and it answers from this help, with a **Show me** button that opens the place.

The chat never changes a page. It can **propose new tasks** in an epic and **new parts** in a plan: they come as a **Review changes** card, and nothing is written until you accept them. Inside a project's chat it only sees that project; with a cloud AI it never sees a project marked Local AI only. **History** in its header reopens earlier chats; **New chat** starts over.

**Everything you ask the AI runs in the background.** A command on selected text (**Fix**, **Rewrite**, **Draw as a diagram** and the others), **Suggest parts** and **Break it down** in a plan, **Break it down** on a task, **Find tasks** and **In short** are all put in the **Queue** of the AI box, which opens by itself, and the screen is never locked. The AI takes them one at a time, so you can work on something else meanwhile. Each one has **Go to**, which takes you back to where you asked (the page, the plan and its part, or the task). When an answer is ready, look at it there: for a text, **Show the original** shows what it was and **Accept** writes it in the page (if the text has changed since you asked, nothing is written); for a list (parts, steps, tasks), tick what to keep and press **Add**, or **Try again**. Nothing is written before you say so.

## Review what the AI proposes

The AI commands that change pages (the page's **AI** button and right-click → **AI** on a folder) show their progress in the AI box, then a **Review changes** card. Open it to see every file, what changes, and why. Accept or reject each file, then **Apply selected**. Before anything is applied Nexmio Work saves a snapshot, and afterwards all changes are one entry in the history, so everything can be undone. **File → Undo the last AI change** takes the last one back.

**Nexmio Work checks every change** before you see it: are the links, tags, numbers and dates, names, properties and code the same, did a part go missing, did the AI add words of its own in front? A change that fails a check is still shown, but it is not selected in the review and the review says why. **Fix spelling** only lets the AI send back the words that are wrong; nothing else in the page can change.

**Long runs start with three pages.** When a command works on more than five pages, Nexmio Work does the first three and stops. Look at those changes, then press **Looks good, do the other …**, or reject them and stop there. A run handles up to 50 pages when changing text, 300 when sorting and 30 when writing one page from many.

You see what the AI is doing while it works, and **Stop** cancels at any time.

## New facts

The AI has no internet access and only knows what it learned in training, so it can be out of date or wrong. It **does not write new documentation or facts** for you: if you ask, it says so. It works with what is in your pages: structure, merging, correcting, summarising, linking. For new facts, find them yourself and paste them into a page; Nexmio Work can then help you structure them.

## Choose which AI to use

Nexmio Work uses an AI that runs on your own computer: the **built-in AI** (llama.cpp), or an AI of your own: **LM Studio** or another OpenAI-compatible server on this computer, or a **cloud AI** (OpenAI and others), which you turn on yourself after a warning that your pages are then sent to it. **Settings → AI** lists them in the order that suits where Nexmio Work runs, with the state of each; click one to use it, and its setup is right under it (a model to download, or an address and the steps for that kind of provider). The built-in AI is in beta: what works best depends on your computer. **Test it** under an AI sends one short question, with none of your pages, and shows the answer or the error.

**The AI is beta.** It is still being built, will change, and can make mistakes: the chat, the text commands and the other AI help are marked **Beta**, and every answer is yours to check before you keep it. Everything else in Nexmio Work works without an AI. Help → **About the AI beta…** shows the first-start notice again.

**Cloud AI, as a last resort.** If no AI on your computer is good enough, an OpenAI-compatible cloud service (added under **Cloud AI** with its address and key) can be the app's AI. Nexmio Work asks first: your pages, the text you select and your questions are then sent to that company, under its terms, and it is your responsibility. You must tick "I understand" before it is used. While it is on, the status bar says **Cloud AI** and the chat shows it in orange. A project marked **Local AI only** never uses it, and choosing another AI turns it off again. Under **Settings → AI** you have two AIs at once: the **Main AI**, which everything uses (it can be the cloud AI), and the **Local AI**, which always runs on your computer and is what a project marked Local AI only uses. Choose the Local AI in the box above the list; if the Main AI is already on your computer, the Local AI is the same.

**Add provider** asks which kind you want (LM Studio or another server on this computer). The model is chosen in the settings. A built-in AI that is not loaded is loaded by itself when you ask it something.

## Preview and Stable

Nexmio Work comes in two editions. **Preview** has the newest features and changes often; it is the edition you run if the status bar says `preview`. **Stable** is the finished release. They can be installed side by side and open the same vaults. The first time a new version starts, **What's new** lists what changed in it (it is also under **Help → What's new**). Nexmio Work never looks for updates by itself: **Help → Check for new version…** opens the page of releases in your browser.

## More

- **Settings → AI** has **About me and my pages** (read by the chat and the skills, not by the fixed commands), **Language of the AI's answers** (Same as the text, or a language you choose) and **Let the AI check its own answer** (off by default): the AI is asked once more whether its answer to a text command is right, which is slower but helps with small models.
- A small model sometimes answers with nothing useful (an empty text, or most of the text gone). Nexmio Work then tries once more and says so instead of offering it.
- Nexmio Work uses an AI **on your own computer**: LM Studio, or its own **built-in AI** (see the Built-in AI topic). Your pages are only sent to a cloud AI if you turn one on yourself under Settings → AI, after a warning.
