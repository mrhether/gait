# Gait CLI

A simple CLI tool to streamline Git workflows, including generating commit messages and creating pull requests with the help of OpenAI's API.

## Installation

Ensure you have Node.js installed, then install the CLI globally:

```bash
npm install -g gait-cli
```

## Prerequisites

1. **OpenAI API Key**: Export your OpenAI API key as an environment variable:
   ```bash
   export OPENAI_API_KEY=your-openai-api-key
   ```

2. **GitHub CLI**: Ensure the `gh` CLI is installed and authenticated with your GitHub account. [GitHub CLI Installation Guide](https://cli.github.com/manual/installation).

## Usage

### Command: `gait commit`

The `gait commit` command automates the process of generating a commit message and committing staged changes.

#### Workflow:
1. Stage your changes manually using `git add`.
2. The command generates a commit message based on the staged changes.
3. Creates a Git commit with the generated message.

#### Syntax:

```bash
gait commit
```

#### Example

```bash
# Stage your changes
git add .

# Run the command
gait commit
```

Expected output:
```
Changes staged for commit, committing...
Generated Commit Message: Add new feature to improve user experience
[master 123abc4] Add new feature to improve user experience
Changes committed successfully!
```

---

### Command: `gait pr` (Alias: `gait pull-request`)

The `gait pr` command automates the process of pushing a branch and creating a pull request on GitHub.

#### Workflow:
1. Stage your changes manually using `git add`.
2. The command generates a commit message based on the staged changes.
3. Creates a Git commit, pushes the branch, and opens a pull request in your browser.

#### Syntax:

```bash
gait pr --branch <branch-name>
```

#### Options:
- `-b, --branch <branch>`: Specify the branch name. Defaults to the current branch if not provided.

### Example

```bash
# Stage your changes
git add .

# Run the command
gait pr --branch feature/add-new-feature
```

Expected output:
```
Changes staged for commit, committing...
Generated Commit Message: Add new feature to improve user experience
[feature/add-new-feature 123abc4] Add new feature to improve user experience
Branch 'feature/add-new-feature' set up to track remote branch 'feature/add-new-feature' from 'origin'.
Pull request created successfully!
```

This will create a pull request on GitHub and open it in your browser.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.