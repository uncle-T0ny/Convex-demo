---
name: e2e
description: Manage Playwright E2E tests — write, debug, fix, and run them. Automatically checks for missing tests when features change. Use when user mentions e2e tests, asks to add tests, or after new feature work.
allowed-tools: Bash(npx playwright *, npm run test:e2e*, npx vitest *), Read, Grep, Glob, Edit, Write
---

# E2E — Playwright Test Manager

You manage the end-to-end test suite for the Convex Voice Demo app using Playwright.

## Before you start

1. Read `${CLAUDE_SKILL_DIR}/lessons.md` for past mistakes to avoid.
2. Read `${CLAUDE_SKILL_DIR}/inventory.md` for the current test inventory.
3. Scan the `e2e/` directory to see what tests actually exist.

## Project test setup

- **Framework:** Playwright (`@playwright/test`)
- **Config:** `playwright.config.ts` at repo root
- **Test dir:** `e2e/`
- **Base URL:** `http://localhost:5173`
- **Browsers:** Chromium, Firefox, WebKit
- **Web server:** auto-starts `npm run dev:frontend` (Vite only)
- **Retries:** 2 in CI, 0 locally
- **Reporter:** HTML

### Run commands

```bash
npm run test:e2e           # All browsers
npm run test:e2e:ui        # Playwright UI mode
npx playwright test e2e/specific.spec.ts          # Single file
npx playwright test e2e/specific.spec.ts --headed # See the browser
npx playwright test --grep "test name"            # By test name
npx playwright show-report                        # View HTML report
```

## App features to cover

| Feature            | Test file (expected)           | Status |
|--------------------|--------------------------------|--------|
| Page loads         | `e2e/page-load.spec.ts`       | Check inventory.md |
| Session creation   | `e2e/session.spec.ts`         | Check inventory.md |
| Text messaging     | `e2e/text-chat.spec.ts`       | Check inventory.md |
| Voice button       | `e2e/voice-button.spec.ts`    | Check inventory.md |
| Responsive layout  | `e2e/responsive.spec.ts`      | Check inventory.md |
| Error handling     | `e2e/error-handling.spec.ts`  | Check inventory.md |

## Writing tests — patterns

### Standard test structure

```typescript
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  test("should do expected behavior", async ({ page }) => {
    await page.goto("/");
    // Wait for app to be ready
    await expect(page.getByRole("textbox")).toBeVisible();
    // ... test logic
  });
});
```

### Key patterns for this app

- **Wait for session:** The app creates a session on mount. Wait for the TextInput to become enabled before interacting:
  ```typescript
  await expect(page.getByRole("textbox")).toBeEnabled({ timeout: 10000 });
  ```
- **Convex latency:** Mutations are fast but not instant. Use `expect` with polling/timeouts rather than hard waits.
- **Voice features:** Web Speech API is not available in headless mode. Voice tests should verify the button renders and has correct attributes, not actual speech.
- **TTS:** Cannot verify audio output. Test that UI state transitions correctly.
- **No `data-testid` unless necessary:** Prefer accessible selectors (`getByRole`, `getByText`, `getByPlaceholder`).

### What NOT to do

- Don't use `page.waitForTimeout()` for synchronization — use `expect` with auto-retrying assertions
- Don't test Convex internals — test through the UI
- Don't mock the backend for E2E tests (that's what unit tests are for)

## Procedures

### When asked to write/add tests

1. Read the feature code to understand what it does
2. Check `inventory.md` for existing coverage
3. Write the test file in `e2e/`
4. Run it: `npx playwright test e2e/new-test.spec.ts --headed`
5. Fix until green
6. Update `${CLAUDE_SKILL_DIR}/inventory.md`

### When asked to debug/fix failing tests

1. Run the failing test with `--headed` to see what happens
2. Check the HTML report: `npx playwright show-report`
3. Read the test code and the app code it's testing
4. Common issues:
   - Selector changed → update the selector
   - Timing issue → use `expect` with proper timeout
   - Feature changed → update the test
5. Fix and re-run until green
6. Update `${CLAUDE_SKILL_DIR}/lessons.md` if you learned something

### When new features are added (auto-check)

1. Look at what changed: `git diff --name-only HEAD~1` or recent changes
2. Determine if any existing tests need updating
3. Determine if new tests are needed
4. Propose test additions to the user
5. Write and verify the tests
6. Update `${CLAUDE_SKILL_DIR}/inventory.md`

### When features are removed

1. Identify affected test files from `inventory.md`
2. Remove or update the tests
3. Run the full suite to check for cascading failures
4. Update `${CLAUDE_SKILL_DIR}/inventory.md`

## After any test work

- Update `${CLAUDE_SKILL_DIR}/inventory.md` with current state
- If you made a mistake, update `${CLAUDE_SKILL_DIR}/lessons.md`
