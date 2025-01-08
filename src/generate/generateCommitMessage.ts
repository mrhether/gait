import { execSync } from "child_process";
import { getClient } from "./aiClient";

export const COMMIT_MESSAGE_OUTPUT_FORMAT = `
<emoji> <concise description of change>

### Types and Emojis
- 🔧 fix: bug fixes
- ✨ feat: new features
- 🔄 refactor: code improvements
- 📚 docs: documentation updates
- 🧪 test: test-related changes
- 📦 chore: other minor changes

### Example
🔧 Resolve issue with authentication middleware
`;

// Helper function to generate the commit message prompt
function generateCommitMessagePrompt(stagedDiff: string): string {
  return `
### Instruction
Generate a short, high-quality git commit message from the following changes. The message should:
1. Be concise (ideally one sentence, under 50 characters).
2. Use active voice and describe the primary change.
3. Avoid unnecessary words or redundancy.
4. Use an appropriate emoji to represent the commit type.

### Output Format
${COMMIT_MESSAGE_OUTPUT_FORMAT}

### Changes
${stagedDiff}
  `;
}

export async function generateCommitMessage(): Promise<string> {
  const client = getClient();

  const stagedDiff = execSync(`git diff --staged -- . ':!package-lock.json'`, {
    encoding: "utf-8",
  });

  if (!stagedDiff) {
    throw new Error("No staged changes to generate a commit message.");
  }

  const prompt = generateCommitMessagePrompt(stagedDiff);
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    max_tokens: 10000,
  });

  return response.choices?.[0]?.message?.content ?? "Changes";
}
