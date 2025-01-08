import { execSync } from "child_process";
import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import chalk from "chalk"; // Import chalk
import ora from "ora";

const DEFAULT_PULL_REQUEST_TEMPLATE_PATH = ".github/PULL_REQUEST_TEMPLATE.md";

export const PULL_REQUEST_OUTPUT_FORMAT = `
## Summary
- <bullet point summary of major changes>
- <optional bullet point for additional context if necessary>

## How to Test
- <describe how the changes can be tested or verified for correctness, if needed>
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

// Helper function to generate the pull request prompt
function generatePullRequestPrompt(stagedDiff: string): string {
  const pullRequestTemplate = getPullRequestTemplate();

  return `
Generate a high-quality pull request title and summary using the following principles:
Title:
1. The title should be short, actionable, and written in active voice (under 65 characters).
Summary:
2. Should explain what has been changed and why, focusing on the key improvements or bug fixes (under 300 characters).
3. *IT MUST FOLLOW THE TEMPLATE* in Output Format.
4. Ensure content is easy to read with proper formatting.
5. Use Markdown formatting for the Summary
6. Don't include more than 1 lines of blank space between sections.

## Output Format
\`\`\`
{ "title": "<Title>",
 "summary": <SummaryTemplate>
    ${pullRequestTemplate}
  </SummaryTemplate>
}
\`\`\`

## This is the diff of the changes: 
${stagedDiff}
  `;
}

const Result = z.object({
  title: z.string(),
  summary: z.string(),
});

export async function generatePullRequestDetails(base: string) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const branchWithOrigin = base.includes("origin") ? base : `origin/${base}`;
  let diff = execSync(
    `git diff ${branchWithOrigin}...HEAD -- . ':!package-lock.json'`
  ).toString();

  if (!diff) {
    throw new Error("No changes to generate pull request details.");
  }

  if (diff.length > 10000) {
    console.warn(
      "Warning: The diff is too large to process... truncating to 10,000 characters."
    );
    diff = diff.slice(0, 10000);
  }

  const prompt = generatePullRequestPrompt(diff);
  const response = await client.beta.chat.completions.stream({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    response_format: zodResponseFormat(Result, "output"),
    stream: true, // Enable streaming
    max_tokens: 10000,
  });

  let content = "";
  const spinner = ora(
    chalk.green("Generating pull request details...")
  ).start();
  for await (const chunk of response) {
    if (chunk.choices?.[0]?.delta?.content) {
      content += chunk.choices[0].delta.content;
      spinner.text = `Generating pull request details...(${content.length}) \n${content.trim()}`;
    }
  }

  const parsedContent = Result.safeParse(JSON.parse(content));
  if (!parsedContent.success) {
    throw new Error("Could not generate structured pull request details.");
  }
  spinner.succeed(
    chalk.green(
      "Pull request: " +
        parsedContent.data.title +
        "\n" +
        parsedContent.data.summary
    )
  );
  return parsedContent.data;
}
