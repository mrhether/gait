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
}): Promise<void> {
  let gitAction: "create" | "edit" = "create";
  try {
    // Check if a PR already exists for the branch
    const existingPR = execSync(
      `gh pr list --head ${branch} --json number --jq '.[0].number'`
    )
      .toString()
      .trim();

    if (existingPR) {
      console.log(`A pull request already exists for branch ${branch}.`);
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
        const newBranch = `${branch}-update-${Date.now()}`;
        execSync(`git checkout -b ${newBranch}`, { stdio: "inherit" });
        console.log(`Switched to new branch: ${newBranch}`);
        branch = newBranch; // Update the branch name to the new branch
      } else {
        gitAction = "edit";
        console.log("Proceeding to update the existing PR...");
      }
    }

    // Create or update the pull request

    execSync(
      `gh pr ${gitAction} --title "${title}" --body "${summary}" --base ${base} --head ${branch}`,
      { stdio: "inherit" }
    );
    execSync(`gh pr view --web`, { stdio: "inherit" });
  } catch (error) {
    console.error("Error while creating/updating the pull request:", error);
  }
}
