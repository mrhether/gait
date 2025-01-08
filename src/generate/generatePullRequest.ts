import { execSync } from "child_process";
import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

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
### Instruction
Generate a high-quality pull request title and summary using the following principles:
1. The title should be short, actionable, and written in active voice (under 65 characters).
2. The summary should explain what has been changed and why, focusing on the key improvements or bug fixes. IT MUST FOLLOW THE TEMPLATE in Output Format.
3. Ensure content is easy to read with proper formatting.
5. Use Markdown formatting for the Summary

### Output Format
{ "title": "<pull request title>",
 "summary": <SummaryTemplate>
    ${pullRequestTemplate}
  </SummaryTemplate>
}

### Changes
${stagedDiff}
  `;
}

const Result = z.object({
  title: z.string(),
  summary: z.string(),
});

export async function generatePullRequestDetails(baseBranch: string = "main") {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const stagedDiff = execSync(
    `git diff origin/${baseBranch}...HEAD -- . ':!package-lock.json'`
  )
    .toString()
    .trim();

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
