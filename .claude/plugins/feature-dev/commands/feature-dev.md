---
name: feature-dev
description: Launches a guided 7-phase feature development workflow with specialized agents for codebase exploration, architecture design, and quality review
---

# /feature-dev

Launches a guided feature development workflow with 7 distinct phases.

## Usage

```
/feature-dev Add user authentication with OAuth
```

Or simply:
```
/feature-dev
```

The command will guide you through the entire process interactively.

## The 7 Phases

### Phase 1: Discovery
- Clarifies the feature request
- Asks what problem you're solving
- Identifies constraints and requirements
- Summarizes understanding and confirms

### Phase 2: Codebase Exploration
- Launches 2-3 `code-explorer` agents in parallel
- Each agent explores different aspects (similar features, architecture, UI patterns)
- Agents return comprehensive analyses with key files to read
- Presents comprehensive summary of findings

### Phase 3: Clarifying Questions
- Reviews codebase findings and feature request
- Identifies underspecified aspects: edge cases, error handling, integration points, backward compatibility, performance needs
- Presents all questions in an organized list
- Waits for answers before proceeding

### Phase 4: Architecture Design
- Launches 2-3 `code-architect` agents with different focuses:
  - **Minimal changes**: Smallest change, maximum reuse
  - **Clean architecture**: Maintainability, elegant abstractions
  - **Pragmatic balance**: Speed + quality
- Presents comparison with trade-offs and recommendation

### Phase 5: Implementation
- Waits for explicit approval before starting
- Reads all relevant files identified in previous phases
- Implements following chosen architecture
- Follows codebase conventions strictly

### Phase 6: Quality Review
- Launches 3 `code-reviewer` agents in parallel:
  - **Simplicity/DRY/Elegance**: Code quality and maintainability
  - **Bugs/Correctness**: Functional correctness and logic errors
  - **Conventions/Abstractions**: Project standards and patterns
- Presents findings and asks: Fix now, Fix later, or Proceed as-is

### Phase 7: Summary
- Summarizes what was built, key decisions, files modified, and suggested next steps

## When to Use

**Use for:**
- New features that touch multiple files
- Features requiring architectural decisions
- Complex integrations with existing code
- Features where requirements are somewhat unclear

**Don't use for:**
- Single-line bug fixes
- Trivial changes
- Well-defined, simple tasks
- Urgent hotfixes
