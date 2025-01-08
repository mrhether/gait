import { writeFileSync, readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import chalk from "chalk";
import readline from "readline";

// File to store the GitHub token locally
const TOKEN_FILE = ".github_token";

export function isGitHubTokenAvailable(): boolean {
  return existsSync(TOKEN_FILE);
}

export function getGitHubToken(): string | null {
  if (isGitHubTokenAvailable()) {
    return readFileSync(TOKEN_FILE, "utf-8").trim();
  }
  return null;
}

export async function authenticateWithGitHub(): Promise<string | null> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.blue("GitHub Authentication Required:"));
  console.log(
    chalk.yellow(
      "Please authenticate with GitHub to allow access to Copilot GPT-4 tokens."
    )
  );

  return new Promise((resolve) => {
    rl.question(
      chalk.green("Enter your GitHub Personal Access Token: "),
      (token) => {
        rl.close();
        if (token) {
          // Save token locally for future use
          writeFileSync(TOKEN_FILE, token.trim(), { encoding: "utf-8" });
          console.log(chalk.green("GitHub token saved successfully!"));
          resolve(token.trim());
        } else {
          console.log(chalk.red("No token provided. Authentication failed."));
          resolve(null);
        }
      }
    );
  });
}

export function validateGitHubToken(token: string): boolean {
  try {
    // Validate token by making a test API call to GitHub
    const output = execSync(
      `curl -H "Authorization: token ${token}" https://api.github.com/user`,
      { stdio: "pipe" }
    ).toString();

    const data = JSON.parse(output);
    return data && data.login ? true : false;
  } catch (error) {
    return false;
  }
}