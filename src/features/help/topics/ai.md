## The AI

**The AI** in Nexmio Work is a helper that runs on your computer. It is not one chat you have to type into: it is buttons where you work, and each one does one fixed thing. You never have to write a prompt.

**The AI only proposes changes. Nothing is written until you accept it.**

## AI where you work

- **Selected text:** the bar over the selection has **Fix**, **Rewrite** and **Shorten**, and **AI ▾** for more: rewrite with simpler words, more formal or friendlier (always the same meaning), make it a list, translate to Danish or English, **Explain this** (an answer next to the text, nothing changes), **Draw as a diagram** (a Mermaid diagram you can add under the text, or copy) and **Find tasks in it**. For a whole page, **AI → In short** gives its main points and the things to do: nothing is written to the page, and only the things you tick become tasks. You see the change before it is written, with a check that numbers, links and names are still there. **Ctrl/Cmd+K** opens the same menu.
- **The whole page:** the **AI** button above the page: fix spelling and grammar (in the whole page), improve the structure, a short summary at the top, a title and tags, find tasks, split into pages, and an e-mail from the page. **Link related pages** opens the Links panel; it finds pages by the title and tags and needs no AI.
- **A folder:** right-click it → **AI**: sort into folders, find duplicates, an index page and more. **Make an index page** right under it makes a list of links without AI.
- **Search:** a search that reads like a question ("what is the service desk number?") shows **Answer from my pages**. Press **Get an answer**: the AI reads the pages that fit and answers, with the pages it used.
- **A task:** Break it down, **Write a status line from the log**, and in Focus **Help me start**.
- **An idea:** **Think it through** (three questions) and **Suggest first steps** (they become one task with those steps).
- **Any text box:** select text in a box (a task's note, the log, an idea, a project's text) and the same small bar appears, or press **Ctrl/Cmd+K** in the box. Name, search and password boxes have no AI.
- **Spelling help** (made for dyslexia): turn it on in the status bar or in Settings. A moment after you stop typing, misspelt words get a wavy line. Click a word to fix it, ignore it or add it to your words. Nothing changes by itself.

## When there is no AI

Everything that is not AI works as always: pages, search, tasks, ideas, the outline, links, history and images. The AI buttons are greyed out and say why (for example "No AI is set up" or "The built-in AI is not loaded"), with **Set up AI**. The system spellcheck still works.

## Ask about my pages

For a free question, press **Ctrl/Cmd+L**, or the **AI** tab of the right panel. The chat opens beside the page, so the whole page can be read while you ask; **×** closes the panel, and the chat is kept. Type a question and press **Enter**. Nexmio Work reads the open page (untick **Include the open page** for general questions) and searches your pages to answer. The chat only answers: it never changes a page. **History** in its header reopens earlier chats; **New chat** starts over.

**AI commands in the background.** A command on selected text (**Fix**, **Rewrite**, **Draw as a diagram** and the others) is put in the **Tasks** tab of the AI window, and the screen is not locked. The AI takes them one at a time, so you can work on another page meanwhile. When an answer is ready, open **Tasks**, look at it (**Show the original** shows what the text was) and press **Accept**: Nexmio Work opens the page and writes it there. If the text has changed since you asked, nothing is written.

## Review what the AI proposes

The AI commands that change pages (the page's **AI** button and right-click → **AI** on a folder) show their progress in the **AI** tab, then a **Review changes** card. Open it to see every file, what changes, and why. Accept or reject each file, then **Apply selected**. Before anything is applied Nexmio Work saves a snapshot, and afterwards all changes are one entry in the history, so everything can be undone. **File → Undo the last AI change** takes the last one back.

**Nexmio Work checks every change** before you see it: are the links, tags, numbers and dates, names, properties and code the same, did a part go missing, did the AI add words of its own in front? A change that fails a check is still shown, but it is not selected in the review and the review says why. **Fix spelling** only lets the AI send back the words that are wrong; nothing else in the page can change.

**Long runs start with three pages.** When a command works on more than five pages, Nexmio Work does the first three and stops. Look at those changes, then press **Looks good, do the other …**, or reject them and stop there. A run handles up to 50 pages when changing text, 300 when sorting and 30 when writing one page from many.

You see what the AI is doing while it works, and **Stop** cancels at any time.

## New facts

The AI has no internet access and only knows what it learned in training, so it can be out of date or wrong. It **does not write new documentation or facts** for you: if you ask, it says so. It works with what is in your pages: structure, merging, correcting, summarising, linking. For new facts, find them yourself and paste them into a page; Nexmio Work can then help you structure them.

## Choose which AI to use

Nexmio Work uses an AI that runs on your own computer: the **built-in AI** (Phi Silica on a Copilot+ PC in the Store version, Foundry Local, or llama.cpp), **LM Studio** or another OpenAI-compatible server on this computer. **Settings → AI** lists them in the order that suits where Nexmio Work runs, with the state of each; click one to use it, and its setup is right under it (a model to download, or an address and the steps for that kind of provider). The built-in AIs are in beta and none is recommended over the others: what works best depends on your computer, so try them in turn and keep the one that works best. **Test it** under an AI sends one short question, with none of your pages, and shows the answer or the error.

**The AI is beta.** It is still being built, will change, and can make mistakes: the chat, the text commands and the other AI help are marked **Beta**, and every answer is yours to check before you keep it. Everything else in Nexmio Work works without an AI. Help → **About the AI beta…** shows the first-start notice again.

**Cloud AI, as a last resort.** If no AI on your computer is good enough, an OpenAI-compatible cloud service (added under **Cloud AI** with its address and key) can be the app's AI. Nexmio Work asks first: your pages, the text you select and your questions are then sent to that company, under its terms, and it is your responsibility. You must tick "I understand" before it is used. While it is on, the status bar says **Cloud AI** and the chat shows it in orange. A project marked **Local AI only** never uses it, and choosing another AI turns it off again.

**Add provider** asks which kind you want (LM Studio or another server on this computer). The model is chosen in the settings. A built-in AI that is not loaded is loaded by itself when you ask it something.

## Preview and Stable

Nexmio Work comes in two editions. **Preview** has the newest features and changes often; it is the edition you run if the status bar says `preview`. **Stable** is the finished release. They can be installed side by side and open the same vaults. The first time a new version starts, **What's new** lists what changed in it (it is also under **Help → What's new**). Nexmio Work never looks for updates by itself: **Help → Check for new version…** opens the page of releases in your browser.

## More

- **Settings → AI** has **About me and my pages** (read by the chat and the skills, not by the fixed commands), **Language of the AI's answers** (Same as the text, or a language you choose) and **Let the AI check its own answer** (off by default): the AI is asked once more whether its answer to a text command is right, which is slower but helps with small models.
- A small model sometimes answers with nothing useful (an empty text, or most of the text gone). Nexmio Work then tries once more and says so instead of offering it.
- Nexmio Work uses an AI **on your own computer**: LM Studio, or its own **built-in AI** (see the Built-in AI topic). Your pages are only sent to a cloud AI if you turn one on yourself under Settings → AI, after a warning.
