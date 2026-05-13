---
name: commit
description: Creates a git commit with an automatically generated commit message based on staged and unstaged changes
---

# /commit

Creates a git commit with an automatically generated commit message.

## What it does

1. Analyzes current git status
2. Reviews both staged and unstaged changes
3. Examines recent commit messages to match your repository's style
4. Drafts an appropriate commit message
5. Stages relevant files
6. Creates the commit

## Usage

```
/commit
```

## Features

- Automatically drafts commit messages that match your repo's style
- Follows conventional commit practices
- Avoids committing files with secrets (.env, credentials.json)
- Includes Claude Code attribution in commit message

## Guidelines

- Review the staged changes before committing
- Let Claude analyze your changes and match your repo's commit style
- Trust the automated message, but verify it's accurate
- Use for routine commits during development
