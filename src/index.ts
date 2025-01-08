#!/usr/bin/env node
import dotenv from "dotenv";
import chalk from "chalk";
import ora from "ora";

// Helper function to safely initialize ora spinner
function createSafeSpinner(text: string) {
  const isInteractive = process.stdout && process.stdout.isTTY;
  return ora({ text, isEnabled: isInteractive });
}

import { program } from "commander";
import {
  generateCommitMessage,
  generatePullRequestDetails,
} from "./generateCommit";
import { createPR } from "./createPR";
import {
  hasStagedChanges,
  commitChanges,
  pushBranch,
  getCurrentBranch,
} from "./gitUtils";

dotenv.config();

// Helper function to handle staging and committing changes
async function handleCommit(): Promise<void> {
  if (hasStagedChanges()) {
    const spinner = createSafeSpinner(
      "Staged changes detected. Generating commit message..."
    ).start();

    try {
      // Generate commit message
      const commitMessage = await generateCommitMessage();
      spinner.succeed(
        chalk.green(`Generated Commit Message: ${commitMessage}`)
      );

      // Commit changes
      spinner.start("Committing changes...");
      commitChanges(commitMessage);
      spinner.succeed(chalk.green("Changes committed successfully!"));
    } catch (error) {
      spinner.fail(chalk.red("Failed to commit changes."));
      console.error(chalk.red("Error:"), error);
    }
  } else {
    console.log(
      chalk.yellow(
        "No staged changes found. Please stage changes and try again."
      )
    );
  }
}

async function handlePushAndPR(options: any) {
  const branchName = options.branch || getCurrentBranch();
  const spinner = createSafeSpinner(
    `Pushing branch ${chalk.blue(branchName)}...`
  ).start();

  try {
    pushBranch(branchName);
    spinner.succeed(chalk.green(`Branch ${branchName} pushed successfully!`));

    // Generate and create pull request
    spinner.start("Generating Pull Request Details...");
    const prInfo = await generatePullRequestDetails();
    spinner.succeed(
      chalk.green(`Pull Request Details Generated: ${prInfo.title}`)
    );

    spinner.start(`Creating Pull Request: ${chalk.blue(prInfo.title)}...`);
    await createPR({
      branch: branchName,
      title: prInfo.title,
      summary: prInfo.summary,
    });
    spinner.succeed(chalk.green("Pull request created successfully!"));
  } catch (error) {
    spinner.fail(chalk.red("Failed to push branch or create pull request."));
    console.error(chalk.red("Error:"), error);
  }
}

program
  .name("gait")
  .command("commit")
  .description("Stage changes, generate a commit message, and commit.")
  .action(async () => {
    try {
      await handleCommit();
    } catch (err) {
      console.error(chalk.red("Error:"), err);
    }
  });

program
  .command("pr")
  .alias("pull-request")
  .option("-b, --branch <branch>", "Branch name")
  .action(async (options) => {
    try {
      // Commit changes if there are staged changes
      await handleCommit();
      // Push the branch
      await handlePushAndPR(options);
    } catch (err) {
      console.error(chalk.red("Error:"), err);
    }
  });

program.parse(process.argv);
