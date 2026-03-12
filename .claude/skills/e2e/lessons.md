# E2E Test Lessons

Record mistakes and learnings here so they are not repeated.

## Format

```
### YYYY-MM-DD — Short title
**What happened:** ...
**Root cause:** ...
**Fix / rule:** ...
```

---

### 2026-03-11 — toHaveCount expects a number, not regex
**What happened:** Used `await expect(locator).toHaveCount(/./)` hoping to assert "at least 1". Test failed with `expected float, got object`.
**Root cause:** Playwright's `toHaveCount()` only accepts an exact number. There's no regex or range support.
**Fix / rule:** Use `const count = await locator.count(); expect(count).toBeGreaterThanOrEqual(N);` for range assertions on element counts.

### 2026-03-11 — getByText matches multiple elements (strict mode)
**What happened:** `page.getByText("MyStoria")` matched both the heading and an empty-state paragraph containing "MyStoria", causing a strict mode violation.
**Root cause:** `getByText` searches all text content on the page. The app name appears in multiple places.
**Fix / rule:** Use more specific selectors like `getByRole("heading", { name: "MyStoria" })` when text appears in multiple elements. Prefer role-based selectors over text selectors.

### 2026-03-11 — Firefox and WebKit not installed locally
**What happened:** Running `npx playwright test` (all browsers) showed 62 failures. All were from missing browser binaries, not actual test failures.
**Root cause:** Only Chromium was installed. Firefox and WebKit need `npx playwright install`.
**Fix / rule:** Run with `--project=chromium` locally if other browsers aren't installed. CI should install all browsers. Check for "Executable doesn't exist" errors before debugging test logic.
