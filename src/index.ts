#!/usr/bin/env node
import dotenv from "dotenv";
import chalk from "chalk";
import ora from "ora";
import { program } from "commander";
import { execSync } from "child_process";
import inquirer from "inquirer";
import { generateCommitMessage, generatePullRequestDetails } from "./generate";
import {
  hasStagedChanges,
  commitChanges,
  pushBranch,
  getCurrentBranch,
  getDefaultBranch,
  getUnstagedFiles,
} from "./gitUtils";
import { createPR } from "./ghUtils";

dotenv.config();

// Helper function to handle staging and committing changes
async function handleCommit(
  warn = true,
  commitArgs: string[] = []
): Promise<void> {
  if (hasStagedChanges()) {
    const spinner = ora(
      "Staged changes detected. Generating commit message..."
    ).start();

    try {
      // Generate commit message
      const commitMessage = await generateCommitMessage();
      spinner.succeed(
        chalk.green(`Generated Commit Message: ${commitMessage}`)
      );

      // Commit changes with additional arguments
      spinner.start(`Committing: git commit ${commitArgs.join(" ")}...`);
      commitChanges(`${commitMessage} ${commitArgs.join(" ")}`);
      spinner.succeed(chalk.green("Changes committed successfully!"));
    } catch (error) {
      spinner.fail(chalk.red("Failed to commit changes."));
      console.error(chalk.red("Error:"), error);
    }
  } else {
    const unstagedFiles = getUnstagedFiles();
    if (unstagedFiles.length > 0) {
      console.log(
        chalk.yellow(
          "No staged changes found. The following files are unstaged or untracked:"
        )
      );
      console.log(chalk.blue(unstagedFiles.join("\n")));
      const { addFiles } = await inquirer.prompt([
        {
          type: "confirm",
          name: "addFiles",
          message: chalk.green("Would you like to add these files?"),
          default: false,
        },
      ]);

      if (addFiles === true) {
        try {
          execSync("git add -A", { stdio: "inherit" });
          console.log(
            chalk.green(
              "Files added successfully. Please stage changes and try again."
            )
          );
          return await handleCommit(warn, commitArgs); // Retry after adding files
        } catch (error) {
          console.error(chalk.red("Failed to add files."), error);
        }
      }
    }

    if (warn) {
      console.log(
        chalk.yellow(
          "No staged changes found. Please stage changes and try again."
        )
      );
    }
  }
}

async function handlePushAndPR(options: any) {
  // Determine the default branch dynamically
  const defaultBranch = getDefaultBranch();
  const branchName = options.branch || getCurrentBranch();
  const spinner = ora(`Pushing branch ${chalk.blue(branchName)}...`).start();

  try {
    pushBranch(branchName);
    spinner.succeed(chalk.green(`Branch ${branchName} pushed successfully!`));

    // Generate and create pull request
    const prInfo = await generatePullRequestDetails(defaultBranch);

    spinner.start(`Creating/Updating Pull Request:...`);
    const action = await createPR({
      branch: branchName,
      base: defaultBranch,
      title: prInfo.title,
      summary: prInfo.summary,
    });
    spinner.succeed(chalk.green(`Pull request ${action} successfully!`));
  } catch (error) {
    spinner.fail(chalk.red("Failed to push branch or create pull request."));
    console.error(chalk.red("Error:"), error);
  }
}

const trycatch = async (fn: Function) => {
  try {
    await fn();
  } catch (error) {
    console.error(chalk.red("Error:"), error);
  }
};

program
  .command("c")
  .alias("commit")
  .description("Stage changes, generate a commit message, and commit.")
  .allowExcessArguments() // Allow passing unknown options to the command
  .allowUnknownOption()
  .action((_, b) => {
    trycatch(() => handleCommit(true, b.args));
  });

program
  .command("pr")
  .alias("pull-request")
  .option("-b, --branch <branch>", "Branch name")
  .allowExcessArguments()
  .action(async (_, b) => {
    await trycatch(async () => {
      await handleCommit(false, b.args);
      await handlePushAndPR(b.args);
    });
  });

program.parse(process.argv);
