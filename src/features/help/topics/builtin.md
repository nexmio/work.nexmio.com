1. Open **Settings → AI**.
2. Choose a model and press **Download**.
3. Use any AI button. The model loads by itself.

![The AI settings](img/settings-ai.png)

<!-- more -->

## The built-in AI

Nexmio Work can run its own AI **on this computer**, so you do not need LM Studio. Your pages never leave the computer. The built-in AI is what Nexmio Work uses from the start. You can choose LM Studio instead under **Settings → AI**.

## Set it up

1. Open **Settings → AI** (or press **Set up** in the status bar).
2. The AI engine is part of Nexmio Work, so there is nothing to choose or install: it uses the graphics card (AMD, Intel or Nvidia) when there is one that works, and the processor otherwise. If the graphics card gives an error, set **Use the graphics card** to "Not at all" under Settings. The Microsoft Store version is the same, and keeps the model in its own data folder.
3. Choose a **model**. **Gemma 4 12B** is the recommended one and needs about 12 GB of memory. **E4B** and **E2B** are lighter. You can also add your own `.gguf` file.
4. Press **Download**. This fetches the **model** (Google Gemma 4, Apache-2.0) from huggingface.co, and nothing is downloaded before you press it. It is several GB, shown before you start, and takes about as much disk space. The engine that runs it, llama.cpp (MIT licence), comes with Nexmio Work. The file is checked after the download and kept in Nexmio Work's own folder. If the connection breaks, press Download again: it continues where it stopped.

## Load and unload

**Load AI** loads the model into memory. It takes some seconds to a minute. The button is in the status bar and in the settings of the AI. You do not have to press it first: when you use an AI command or send a question while the AI is not loaded, Nexmio Work loads it by itself. **Unload AI** (in the same two places) unloads the model and gives the memory back, so use it when you need the memory for something else. Closing Nexmio Work, or a crash, also unloads it. In Settings you can choose that Nexmio Work unloads it by itself after some idle minutes.

## When something goes wrong

A red box says what happened and what to do, step by step. **Show details** has the engine's own last lines, and **Copy details** copies them. The most common causes are too little memory (lower the context size, use less of the graphics card, or choose a lighter model), an out-of-date graphics driver (update it, or choose CPU only), and security software blocking the engine.

## Settings

They apply the next time the AI is loaded. If it is loaded now, press **Unload AI** and then **Load AI**.

- **Context size**: how much text Nexmio Work keeps in mind. More uses much more memory.
- **Use the graphics card**: automatic, as much as possible, not at all, or a number of layers.
- **Processor threads**, **Flash attention**, **Let the model think** (slower; off is best for pages), **Unload after**.

## Files

The engine and the models are in a folder called `nexmio-work-ai`. On Windows it is next to the program, and **uninstalling Nexmio Work removes it**. On Linux it is in your user data folder; **Remove files** in the settings deletes it. Settings → AI shows the exact folder and how much space it uses.
