import dotenv from "dotenv";

import { program } from "commander";
import { generateCommitMessage } from "./generateCommit";
import { createPR } from "./createPR";
import { hasStagedChanges, commitChanges, pushBranch } from "./gitUtils";

dotenv.config();

program
  .command("commit-pr")
  .option("-b, --branch <branch>", "Branch name")
  .action(async (options) => {
    try {
      // 1. Check for staged changes
      if (!hasStagedChanges()) {
        console.error("No changes staged for commit. Exiting...");
        process.exit(1);
      }

      // 2. Generate commit message
      const commitMessage = await generateCommitMessage();
      console.log(`Generated Commit Message: ${commitMessage}`);

      // 3. Commit and push changes
      commitChanges(commitMessage);
      const branchName = options.branch || "auto-generated-branch";
      pushBranch(branchName);

      // 4. Create Pull Request
      await createPR(branchName, commitMessage);
      console.log("Pull request created successfully!");
    } catch (err) {
      console.error("Error:", err);
    }
  });

program.parse(process.argv);
