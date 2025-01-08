import { execSync } from "child_process";
// import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import chalk from "chalk";
import ora from "ora";
import { getClient as openAI } from "./aiClient";

const DEFAULT_PULL_REQUEST_TEMPLATE_PATH = ".github/PULL_REQUEST_TEMPLATE.md";
const MAX_DIFF_LENGTH = 10000;
const MAX_TOKENS = 6000;

export const PULL_REQUEST_OUTPUT_FORMAT = `
## Summary
- Briefly summarize major changes.
- Include optional context if necessary.

## How to Test
- Provide clear steps to verify correctness.
`;

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

function truncateDiff(diff: string): string {
  if (diff.length > MAX_DIFF_LENGTH) {
    console.warn(
      chalk.yellow("Diff is too large, truncating to 10,000 characters.")
    );
    return diff.slice(0, MAX_DIFF_LENGTH) + "\n\n[...diff truncated]";
  }
  return diff;
}

function generatePullRequestPrompt(diff: string): string {
  const pullRequestTemplate = getPullRequestTemplate();

  return `
Generate a high-quality pull request title and summary adhering to the following guidelines:

Title:
1. Write a short, actionable title in active voice (under 65 characters).
2. Start with the correct Emoji
- 🔧 fix: bug fixes
- ✨ feat: new features
- 🔄 refactor: code improvements
- 📚 docs: documentation updates
- 🧪 test: test-related changes
- 📦 chore: other minor changes

Summary:
2. Summarize what has been changed and why, focusing on key improvements or fixes (under 300 characters).
3. Follow the exact format provided in the template below.
4. Use Markdown formatting for clarity.
5. Avoid excessive blank lines.

## Output Format
\`\`\`
{
  "title": "✨ Impressive Feature",
  "summary": "${pullRequestTemplate}"
}
\`\`\`

## Diff of changes:
${diff}


As a reminder, you must return JSON data with the following format:
{
  "title": "Title",
  "summary": "Summary"
}
`;
}

const Result = z.object({
  title: z.string(),
  summary: z.string(),
});

export async function generatePullRequestDetails(
  baseBranch: string
): Promise<{ title: string; summary: string }> {
  const client = openAI();

  const branchWithOrigin = baseBranch.startsWith("origin")
    ? baseBranch
    : `origin/${baseBranch}`;

  let diff;
  try {
    diff = execSync(
      `git diff ${branchWithOrigin}...HEAD -- . ':!package-lock.json'`
    ).toString();
  } catch (error) {
    throw new Error(
      "Failed to generate git diff. Ensure the branch name is correct."
    );
  }

  if (!diff) {
    throw new Error("No changes detected to generate pull request details.");
  }

  const truncatedDiff = truncateDiff(diff);
  const prompt = generatePullRequestPrompt(truncatedDiff);

  const response = await client.beta.chat.completions.stream({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    stream: true,
    max_tokens: MAX_TOKENS,
    response_format: { type: "json_object" },
    // Uncomment when github actions are fixed to support
    // response_format: zodResponseFormat(Result, "output"),
  });

  let content = "";
  const spinner = ora(
    chalk.green("Generating pull request details...")
  ).start();

  for await (const chunk of response) {
    if (chunk.choices?.[0]?.delta?.content) {
      content += chunk.choices[0].delta.content;
      spinner.text = `Generating pull request details... (${content.length} characters)\n ${chalk.gray(content.trim())}`;
    }
  }

  try {
    const parsedContent = Result.safeParse(JSON.parse(content));
    if (!parsedContent.success) {
      throw new Error("Invalid pull request details generated.");
    }

    spinner.succeed(
      chalk.green(
        "Pull Request Details:\n" +
          chalk.bold(parsedContent.data.title) +
          "\n" +
          parsedContent.data.summary
      )
    );
    return parsedContent.data;
  } catch (error: any) {
    spinner.fail(chalk.red("Failed to parse pull request details."));
    throw new Error("Failed to parse pull request details: " + error.message);
  }
}
