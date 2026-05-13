---
name: commit-push-pr
description: Complete workflow that commits, pushes, and creates a pull request in one step
---

# /commit-push-pr

Complete workflow command that commits, pushes, and creates a pull request in one step.

## What it does

1. Creates a new branch (if currently on main)
2. Stages and commits changes with an appropriate message
3. Pushes the branch to origin
4. Creates a pull request using `gh pr create`
5. Provides the PR URL

## Usage

```
/commit-push-pr
```

## Features

- Analyzes all commits in the branch (not just the latest)
- Creates comprehensive PR descriptions with:
  - Summary of changes (1-3 bullet points)
  - Test plan checklist
  - Claude Code attribution
- Handles branch creation automatically
- Uses GitHub CLI (`gh`) for PR creation

## Requirements

- GitHub CLI (`gh`) must be installed and authenticated
- Repository must have a remote named `origin`
