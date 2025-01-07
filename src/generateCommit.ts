import { execSync } from "child_process";
import { OpenAI } from "openai";

export async function generateCommitMessage(): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const stagedDiff = execSync("git diff --staged").toString();

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
