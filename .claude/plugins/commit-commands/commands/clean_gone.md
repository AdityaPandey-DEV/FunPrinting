---
name: clean_gone
description: Cleans up local branches that have been deleted from the remote repository
---

# /clean_gone

Cleans up local branches that have been deleted from the remote repository.

## What it does

1. Lists all local branches to identify `[gone]` status
2. Identifies and removes worktrees associated with `[gone]` branches
3. Deletes all branches marked as `[gone]`
4. Provides feedback on removed branches

## Usage

```
/clean_gone
```

## Features

- Handles both regular branches and worktree branches
- Safely removes worktrees before deleting branches
- Shows clear feedback about what was removed
- Reports if no cleanup was needed

## When to use

- After merging and deleting remote branches
- When your local branch list is cluttered with stale branches
- During regular repository maintenance
