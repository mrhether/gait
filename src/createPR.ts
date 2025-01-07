import { execSync } from "child_process";

export function createPR(branch: string, commitMessage: string): void {
  execSync(
    `gh pr create --title "${commitMessage}" --body "Auto-generated PR" --base main --head ${branch}`,
    { stdio: "inherit" }
  );
}
