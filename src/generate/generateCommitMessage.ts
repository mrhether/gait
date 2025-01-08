import { execSync } from "child_process";
import { OpenAI } from "openai";

export const COMMIT_MESSAGE_OUTPUT_FORMAT = `
<emoji> <concise description of change>
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

### Types and Emojis
- 🔧 fix: bug fixes
- ✨ feat: new features
- 🔄 refactor: code improvements
- 📚 docs: documentation updates
- 🧪 test: test-related changes
- 📦 chore: other minor changes

### Example
🔧 resolve issue with authentication middleware

### Changes
${stagedDiff}
  `;
}

export async function generateCommitMessage(): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const stagedDiff = execSync(
    `git diff --staged -- . ':!package-lock.json'`
  ).toString();

  if (!stagedDiff) {
    throw new Error("No staged changes to generate a commit message.");
  }

  const prompt = generateCommitMessagePrompt(stagedDiff);
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
  });

  return response.choices?.[0]?.message?.content ?? "Changes";
}
