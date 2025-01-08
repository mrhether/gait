import { execSync } from "child_process";
import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

export const PULL_REQUEST_OUTPUT_FORMAT = `
**Summary:**
- <bullet point summary of major changes>
- <optional bullet point for additional context if necessary>
**Caveats:**
<list of any caveats or limitations>
**Testing:**
- <describe how the changes can be tested or verified for correctness, if needed>
`;

export const COMMIT_MESSAGE_OUTPUT_FORMAT = `
<emoji> <concise description of change>
`;

// Add a helper function to generate the commit message prompt
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

const DEFAULT_PULL_REQUEST_TEMPLATE_PATH = ".github/PULL_REQUEST_TEMPLATE.md";

function getPullRequestTemplate(): string {
  const templatePath = resolve(
    process.cwd(),
    DEFAULT_PULL_REQUEST_TEMPLATE_PATH
  );

  if (existsSync(templatePath)) {
    console.log(`Using custom pull request template from ${templatePath}`);
    return readFileSync(templatePath, "utf-8");
  }

  return PULL_REQUEST_OUTPUT_FORMAT;
}

// Add a helper function to generate the pull request prompt
function generatePullRequestPrompt(stagedDiff: string): string {
  const pullRequestTemplate = getPullRequestTemplate();

  return `
### Instruction
Generate a high-quality pull request title and summary using the following principles:
1. The title should be short, actionable, and written in active voice (under 65 characters).
2. The summary should explain what has been changed and why, focusing on the key improvements or bug fixes.
3. Ensure content is easy to read with proper formatting.
4. If there are limitations or follow-up actions required, include them under "Caveats".
5. Use Markdown formatting where appropriate.

### Output Format
${pullRequestTemplate}

### Changes
${stagedDiff}
  `;
}

export async function generateCommitMessage(): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const stagedDiff = execSync(`git diff --staged`).toString();

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

const Result = z.object({
  title: z.string(),
  summary: z.string(),
});

export async function generatePullRequestDetails(baseBranch: string = "main") {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const stagedDiff = execSync(`git diff ${baseBranch}...HEAD`).toString();

  if (!stagedDiff) {
    throw new Error("No changes to generate pull request details.");
  }

  const prompt = generatePullRequestPrompt(stagedDiff);

  const response = await client.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    response_format: zodResponseFormat(Result, "pull_request_details"),
  });

  const content = response.choices?.[0]?.message?.parsed;
  if (!content) {
    throw new Error("Could not generate structured pull request details.");
  }

  return content;
}
