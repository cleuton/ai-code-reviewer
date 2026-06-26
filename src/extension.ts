import * as vscode from "vscode";
import Anthropic from "@anthropic-ai/sdk";


/**
 * The model we use for reviews. Sonnet is a good balance of speed and quality
 * for code review. Swap to a Haiku model if you want faster, cheaper reviews.
 */
const MODEL = "claude-sonnet-4-6";

/**
 * Read the API key. We first check the extension setting
 * (aiCodeReviewer.apiKey), then fall back to the ANTHROPIC_API_KEY
 * environment variable. Returns undefined if neither is set.
 */
function getApiKey(): string | undefined {
  const fromSetting = vscode.workspace
    .getConfiguration("aiCodeReviewer")
    .get<string>("apiKey");

  if (fromSetting && fromSetting.trim().length > 0) {
    return fromSetting.trim();
  }
  return process.env.ANTHROPIC_API_KEY;
}

/**
 * Build the prompt sent to Claude. We give it the language and the exact
 * code the user selected, and ask for a short, severity-ranked review.
 */
function buildPrompt(languageId: string, code: string): string {
  return `You are a senior engineer doing a focused code review.

Review the following ${languageId} code. Be concise and practical.
For each issue, give:
- a severity (HIGH / MEDIUM / LOW)
- one sentence describing the problem
- one sentence suggesting the fix

If the code looks fine, say so in one line. Do not rewrite the whole file.

CODE:
\`\`\`${languageId}
${code}
\`\`\``;
}

/**
 * This runs once when the extension is first activated (the first time the
 * command is invoked). We register the command here.
 */
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "aiCodeReviewer.reviewSelection",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("Open a file first.");
        return;
      }

      // Grab whatever the user has highlighted.
      const selection = editor.document.getText(editor.selection);
      if (!selection || selection.trim().length === 0) {
        vscode.window.showWarningMessage("Select some code to review.");
        return;
      }

      const apiKey = getApiKey();
      if (!apiKey) {
        vscode.window.showErrorMessage(
          "No API key. Set aiCodeReviewer.apiKey in Settings, or export ANTHROPIC_API_KEY."
        );
        return;
      }

      const client = new Anthropic({ apiKey });
      const languageId = editor.document.languageId;

      // Show a spinner in the status bar while we wait for the model.
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Reviewing selection with Claude...",
          cancellable: false,
        },
        async () => {
          try {
            const response = await client.messages.create({
              model: MODEL,
              max_tokens: 1024,
              messages: [
                { role: "user", content: buildPrompt(languageId, selection) },
              ],
            });

            // The response content is a list of blocks; collect the text ones.
            const review = response.content
              .filter((block) => block.type === "text")
              .map((block) => (block as { text: string }).text)
              .join("\n");

            // Show the review in a new read-only document beside the code.
            const doc = await vscode.workspace.openTextDocument({
              content: review,
              language: "markdown",
            });
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            vscode.window.showErrorMessage(`Review failed: ${message}`);
          }
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

/** Called when the extension is deactivated. Nothing to clean up here. */
export function deactivate() {}
