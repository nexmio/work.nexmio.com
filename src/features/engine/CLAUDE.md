# Built-in AI

The AI that runs inside Nexmio Work: llama.cpp's `llama-server` as a child process (`src-tauri/src/engine/`), with its settings (`BuiltInAiSettings`, shown under its row in Settings → AI), load and unload. Foundry Local and Phi Silica (Copilot+ PCs) were removed in 0.27; the plan is CPU and Vulkan only.

- Nothing is downloaded without the person pressing a button for it.
- The engine answers on `127.0.0.1` only, with a key made for each start.
- The built-in AI is one provider (`builtin`) like any other; the chat code is not specific to it.
