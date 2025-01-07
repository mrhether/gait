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
