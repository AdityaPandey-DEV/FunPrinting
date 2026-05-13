---
name: code-review
description: Automated PR code review using multiple specialized agents with confidence-based scoring
---

# /code-review

Performs automated code review on a pull request using multiple specialized agents.

## What it does

1. Checks if review is needed (skips closed, draft, trivial, or already-reviewed PRs)
2. Gathers relevant CLAUDE.md guideline files from the repository
3. Summarizes the pull request changes
4. Launches 4 parallel agents to independently review:
   - **Agents #1 & #2**: Audit for CLAUDE.md compliance
   - **Agent #3**: Scan for obvious bugs in changes
   - **Agent #4**: Analyze git blame/history for context-based issues
5. Scores each issue 0-100 for confidence level
6. Filters out issues below 80 confidence threshold
7. Outputs review (to terminal by default, or as PR comment with `--comment` flag)

## Usage

```
/code-review [--comment]
```

### Options
- `--comment`: Post the review as a comment on the pull request (default: outputs to terminal only)

## Confidence Scoring

- **0**: Not confident, false positive
- **25**: Somewhat confident, might be real
- **50**: Moderately confident, real but minor
- **75**: Highly confident, real and important
- **100**: Absolutely certain, definitely real

## False Positives Filtered

- Pre-existing issues not introduced in PR
- Code that looks like a bug but isn't
- Pedantic nitpicks
- Issues linters will catch
- General quality issues (unless in CLAUDE.md)
- Issues with lint ignore comments

## Requirements

- Git repository with GitHub integration
- GitHub CLI (`gh`) installed and authenticated
- CLAUDE.md files (optional but recommended for guideline checking)

## Review Output Format

```
## Code review
Found 3 issues:
1. Missing error handling for OAuth callback (CLAUDE.md says "Always handle OAuth errors")
   https://github.com/owner/repo/blob/abc123.../src/auth.ts#L67-L72
2. Memory leak: OAuth state not cleaned up (bug due to missing cleanup in finally block)
   https://github.com/owner/repo/blob/abc123.../src/auth.ts#L88-L95
3. Inconsistent naming pattern (src/conventions/CLAUDE.md says "Use camelCase for functions")
   https://github.com/owner/repo/blob/abc123.../src/utils.ts#L23-L28
```
