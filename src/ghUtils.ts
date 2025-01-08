import { execSync } from "child_process";

export function createPR({
  branch,
  title,
  summary,
}: {
  branch: string;
  title: string;
  summary: string;
}): void {
  execSync(
    `gh pr create --title "${title}" --body "${summary}" --base main --head ${branch}`,
    { stdio: "inherit" }
  );
  execSync(`gh pr view --web`, { stdio: "inherit" });
}
