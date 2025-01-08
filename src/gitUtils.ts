import { execSync } from "child_process";

export function hasStagedChanges(): boolean {
  const output = execSync("git diff --staged --name-only").toString().trim();
  return output.length > 0;
}

export function commitChanges(message: string): void {
  execSync(`git commit -m "${message}"`, { stdio: "inherit" });
}

export function pushBranch(branch: string): void {
  execSync(`git push -u origin ${branch}`, { stdio: "inherit" });
}

export function getCurrentBranch(): string {
  return execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
}

export function getDefaultBranch(): string {
  try {
    // Check if `main` exists
    const branches = execSync("git branch -r").toString().trim();
    if (branches.includes("origin/main")) {
      return "origin/main";
    }
    // Fallback to `master` if `main` is not found
    if (branches.includes("origin/master")) {
      return "origin/master";
    }
    // Default to `main` if neither is detected (safe assumption for new repositories)
    return "origin/main";
  } catch (error) {
    console.error("Error determining default branch:", error);
    return "origin/main"; // Fallback to `main` in case of an error
  }
}
// Utility to list unstaged/untracked files
export function getUnstagedFiles(): string[] {
  const output = execSync("git status --porcelain").toString().trim();
  const files = output
    .split("\n")
    .filter(
      (line) =>
        line.trimStart().startsWith("??") || line.trimStart().startsWith("M")
    )
    .map((line) => line.slice(3).trim()); // Extract file paths after status code
  return files;
}
