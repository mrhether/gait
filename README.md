# Gait CLI

A simple CLI tool to streamline Git workflows, including generating commit messages and creating pull requests with the help of OpenAI's API.

## Installation

Ensure you have Node.js installed, then install the CLI globally:

_Install gh cli if you haven't already_

```bash
brew install gh
gh auth login
```

```bash
npm install -g gait-cli
```

## Prerequisites

**OpenAI API Key**: Export your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY=your-openai-api-key
```

## Usage

### Command: `gait pr` (Alias: `gait pull-request`)

The `gait pr` command automates the process of pushing a branch and creating a pull request on GitHub.

#### Workflow:

1. Stage your changes using `git add` or `git add -A`.
2. `gait pr` will commit your changes with a generated commit message and open a pr on github.

#### Options:

- `-b, --branch <branch>`: Specify the branch name. Defaults to the current branch if not provided.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
