# Gait CLI

A simple CLI tool to streamline Git workflows, including generating commit messages and creating pull requests with the help of OpenAI's API.

## Installation

Ensure you have Node.js installed, then install the CLI globally:

```bash

npm install -g gait-cli
```

````

## Prerequisites

1. **OpenAI API Key**: Export your OpenAI API key as an environment variable:

   ```bash
   export OPENAI_API_KEY=your-openai-api-key
````

2. **GitHub CLI**: Ensure the `gh` CLI is installed and authenticated with your GitHub account. [GitHub CLI Installation Guide](https://cli.github.com/manual/installation).

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
