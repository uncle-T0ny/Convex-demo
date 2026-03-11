---
name: commiter
description: Analyze staged/unstaged changes and create a well-structured conventional commit. Use when the user wants to commit changes or says "commit".
allowed-tools: Bash(git *), Read, Grep, Glob
---

# Commiter

Create well-structured conventional commits by analyzing the actual code changes.

## Before you start

Read `${CLAUDE_SKILL_DIR}/lessons.md` for past mistakes to avoid.

## Commit message format

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Types

| Type       | When to use                                  |
|------------|----------------------------------------------|
| `feat`     | New feature or capability                    |
| `fix`      | Bug fix                                      |
| `refactor` | Code restructure, no behavior change         |
| `docs`     | Documentation only                           |
| `style`    | Formatting, whitespace, no logic change      |
| `test`     | Adding or updating tests                     |
| `chore`    | Build, CI, deps, tooling                     |
| `perf`     | Performance improvement                      |

### Scope

Derive from the primary area changed:
- `convex` — backend functions (convex/)
- `ui` — React components (src/components/)
- `hooks` — custom hooks (src/hooks/)
- `e2e` — Playwright tests (e2e/)
- `config` — vite, tsconfig, eslint, etc.
- `ci` — GitHub Actions (.github/)
- `deps` — dependency changes (package.json)

Omit scope if changes span many areas.

### Subject

- Imperative mood ("add", not "added" or "adds")
- Lowercase first letter
- No period at the end
- Max 50 characters

### Body

- Explain **why**, not what (the diff shows what)
- Wrap at 72 characters
- Reference issues if applicable: `Closes #123`

## Procedure

1. **Inspect changes:**
   - Run `git status` (never use `-uall`)
   - Run `git diff --staged` to see what's staged
   - Run `git diff` to see unstaged changes
   - Run `git log --oneline -5` to see recent commit style

2. **Analyze the diff:**
   - Read the changed files if the diff is large or unclear
   - Determine the type, scope, and purpose
   - Check for secrets or sensitive files (.env, credentials) — **never commit those**
   - Warn if unrelated changes are mixed (suggest splitting)

3. **Stage files:**
   - Stage only the relevant files by name (avoid `git add .` or `git add -A`)
   - If there are untracked files that look relevant, ask the user

4. **Compose & commit:**
   - Draft the message and show it to the user for approval
   - Use a HEREDOC to pass the message to `git commit`
   - Run `git status` after to verify success

5. **After commit:**
   - If anything went wrong (hook failure, etc.), diagnose and fix — create a NEW commit, never amend unless asked
   - If you learned something new, update `${CLAUDE_SKILL_DIR}/lessons.md`

## Rules

- NEVER amend a previous commit unless the user explicitly asks
- NEVER use `--no-verify` to skip hooks
- NEVER push unless the user asks
- If pre-commit hooks fail, fix the issue and create a NEW commit
- Ask the user before committing if anything is ambiguous
