# E2E Test Inventory

Current state of Playwright E2E test coverage. Updated after every test change.

## Test files

| File | Tests | Features covered | Last verified |
|------|-------|-----------------|---------------|
| `e2e/page-load.spec.ts` | 4 | Header renders, text input visible, input enabled after session, no console errors | 2026-03-11 |
| `e2e/session.spec.ts` | 5 | Session stored in localStorage, session persists on reload, greeting appears, messages persist, no TTS replay on reload | 2026-03-11 |
| `e2e/text-chat.spec.ts` | 7 | Send message via button, send via Enter, input clears, assistant responds, empty send disabled, input disabled during processing, status transitions | 2026-03-11 |
| `e2e/voice-button.spec.ts` | 4 | Mic button renders (Chromium), correct aria-label, disabled before session ready, hidden in non-Chromium | 2026-03-11 |
| `e2e/dashboard.spec.ts` | 5 | Dashboard heading, Today's Tasks section, task completion counter, Next Appointment, cycle day badge | 2026-03-11 |
| `e2e/responsive.spec.ts` | 6 | Sidebar visible on desktop, hidden on mobile, menu toggle visible/hidden, toggle opens sidebar, input usable on mobile | 2026-03-11 |

**Total: 31 tests (30 pass, 1 skip on Chromium)**

## Coverage gaps

- Error states (network failures, Convex disconnection) — **no test**
- TTS status transitions (speaking state visual changes) — **partially covered** via status checks
- Voice recognition end-to-end — **not automatable** (Web Speech API limitation)
- Multi-turn conversation context accuracy — **not tested** (requires backend assertions)

## Notes

- Firefox and WebKit browsers not installed locally; run `npx playwright install` to enable cross-browser testing
- Convex backend must be running for tests that send messages (text-chat, session greeting)
- Web server auto-starts Vite on port 5173 via `playwright.config.ts`
- Voice button tests use `test.skip()` for browser-specific behavior
