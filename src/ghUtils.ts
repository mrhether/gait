import { execSync } from "child_process";
import inquirer from "inquirer"; // Added import for inquirer

export async function createPR({
  branch,
  base,
  title,
  summary,
}: {
  branch: string;
  base: string;
  title: string;
  summary: string;
}) {
  const baseWithoutOrigin = base.replace("origin/", "");
  const branchWithoutOrigin = branch.replace("origin/", "");

  let gitAction: "create" | "edit" = "create";
  try {
    // Check if a PR already exists for the branch
    const existingPR = execSync(
      `gh pr list --head ${branchWithoutOrigin} --json number --jq '.[0].number'`,
      { stdio: "pipe" }
    )
      .toString()
      .trim();

    if (existingPR) {
      console.log(
        `A pull request already exists for branch ${branchWithoutOrigin}.`
      );
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          default: "update",
          choices: [
            { name: "Update the existing PR", value: "update" },
            { name: "Create a new branch", value: "newBranch" },
          ],
        },
      ]);

      if (action === "newBranch") {
        // Generate a new branch name and switch to it
        const newBranch = `${branchWithoutOrigin}-update-${Date.now()}`;
        execSync(`git checkout -b ${newBranch}`, { stdio: "inherit" });
        console.log(`Switched to new branch: ${newBranch}`);
        branch = newBranch; // Update the branch name to the new branch
      } else {
        gitAction = "edit";
        console.log("Proceeding to update the existing PR...");
      }
    }

    // Create or update the pull request
    const safeSummary = summary.replace(/"/g, '\\"'); // Escape double quotes
    if (gitAction === "create") {
      execSync(
        `gh pr create --title "${title}" --body "${safeSummary}" --base ${baseWithoutOrigin} --head ${branch}`,
        { stdio: "inherit" }
      );
    } else {
      execSync(
        `gh pr edit --title "${title}" --body "${safeSummary}" --base ${baseWithoutOrigin}`,
        { stdio: "inherit" }
      );
    }
    execSync(`gh pr view --web`, { stdio: "inherit" });

    return Promise.resolve(gitAction === "create" ? "created" : "updated");
  } catch (error) {
    console.error("Failed to create or update pull request:", error);
    return Promise.reject("failed");
  }
}
