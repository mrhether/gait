# gAIt CLI

A CLI tool to automate Git workflows using AI-generated commit and PR messages.

## Installation

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

### Create Commits

Generate and commit messages for staged changes.

```bash
gait c
```

### Create Pull Requests

Push a branch and create a pull request on GitHub.

```bash
gait pr
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
