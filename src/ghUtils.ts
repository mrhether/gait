import { execSync } from "child_process";

export function createPR({
  branch,
  base,
  title,
  summary,
}: {
  branch: string;
  base: string;
  title: string;
  summary: string;
}): void {
  execSync(
    `gh pr create --title "${title}" --body "${summary}" --base ${base} --head ${branch}`,
    { stdio: "inherit" }
  );
  execSync(`gh pr view --web`, { stdio: "inherit" });
}
