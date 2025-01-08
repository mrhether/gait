import { execSync } from "child_process";
import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { z } from "zod";

// PR Summary Template
const prSummaryTemplate = `
### Summary
{summary}

### Caveats
{caveats}

### How is this tested?
{testing}
`;

export async function generateCommitMessage(): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const stagedDiff = execSync(`git diff --staged`).toString();

  if (!stagedDiff) {
    throw new Error("No staged changes to generate a commit message.");
  }

  const prompt = `Summarize the following changes in a concise Git commit message:\n\n${stagedDiff}`;
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    max_tokens: 50,
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

  const prompt = `Generate a concise pull request title and summary in based on the following changes in the following format.
  Changes:\n\n${stagedDiff}
  Format:\n\n${prSummaryTemplate}`;

  const response = await client.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: prompt }],
    max_tokens: 1000,
    response_format: zodResponseFormat(Result, "pull_request_details"),
  });

  const content = response.choices?.[0]?.message?.parsed;
  if (!content) {
    throw new Error("Could not generate structured pull request details.");
  }

  return content;
}
