# AI Code Reviewer — VS Code Extension (Lesson 3.7)

A minimal VS Code extension that sends the code you have **selected** to Claude
and shows a short, severity-ranked review in a panel beside your editor.

This is deliberately small: one command, one API call. It shows the shape of a
real extension without the noise.

## What it does

1. You select code in any file.
2. You run **AI: Review Selected Code** (Command Palette or right-click menu).
3. The extension sends the selection to Claude and opens the review beside it.

## Prerequisites

- VS Code 1.85 or newer
- Node.js (LTS)
- An Anthropic API key

> Note: This extension uses an **API key** (`ANTHROPIC_API_KEY`), the same model
> we use everywhere else in this course. This is different from Claude Code
> (Lesson 3.10), which uses a claude.ai subscription instead.

## Setup

```bash
npm install
npm run compile
```

Then provide your key one of two ways:

- **Setting:** open Settings, search "AI Code Reviewer", paste your key into
  `aiCodeReviewer.apiKey`.
- **Environment:** export `ANTHROPIC_API_KEY` before launching VS Code.

## Run it

1. Open this folder in VS Code.
2. Press `F5` to launch the **Extension Development Host** (a second VS Code
   window with the extension loaded).
3. In that window, open any code file, select a function, then run
   **AI: Review Selected Code** from the Command Palette (`Cmd/Ctrl+Shift+P`)
   or by right-clicking the selection.

> The `launch.json` here starts the Dev Host with `--disable-extensions`, so
> your other installed extensions are turned off and cannot interfere with
> activation. Your extension under development still loads. If you remove that
> flag and one of your installed extensions throws on startup, it can stop your
> command from registering and the menu item never appears.

> Changed `package.json`? A `Cmd/Ctrl+R` reload is not enough — stop the Dev
> Host (`Shift+F5`) and press `F5` again.

## Files

| File                 | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `package.json`       | Declares the command, menu, and settings           |
| `src/extension.ts`   | `activate()` registers the command and calls the API |
| `tsconfig.json`      | Compiles `src/` to `dist/` as CommonJS             |

## How it works

- `activate()` runs the first time the command is invoked and registers it.
- The command reads `editor.selection`, builds a prompt, and calls
  `client.messages.create()`.
- The result is opened as a read-only Markdown document beside your code.

## Stretch ideas

- Add a second command, **AI: Explain Selection**, with a different prompt.
- Stream the response token by token instead of waiting for the full reply.
- Cache the last review so re-running on the same selection is instant.
