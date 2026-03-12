# Code Quality Audit Report

**Date:** 2026-03-12
**Scope:** Full codebase — frontend (`src/`), backend (`convex/`), tests, config

---

## Issue Tracker

| # | Status | File(s) | Description | Best Practice / Rule | Fix Commit |
|---|--------|---------|-------------|---------------------|------------|
| **1. Unused Code** | | | | | |
| 1.1 | Fixed | `convex/chat.ts` | Deprecated `synthesizeSpeech` action — dead code, client-callable | Dead code elimination; YAGNI | 8b2fdc3 |
| 1.2 | Fixed | `package.json` | `convex-helpers` package never imported | Remove unused dependencies | 16cf217 (already removed) |
| 1.3 | Fixed | `convex/agent.ts`, `package.json` | `@ai-sdk/cerebras` dead code path — import + switch case never reached | YAGNI; tree-shake unused providers | 16cf217 |
| **2. Duplicated Code** | | | | | |
| 2.1 | Fixed | `convex/agent.ts`, `convex/data.ts`, `convex/dashboard.ts` | Date formatting — 3 implementations of `toISOString().split("T")[0]` | DRY — extract shared utility | 2b56fef |
| 2.2 | Open | `convex/data.ts`, `convex/dashboard.ts` | Appointment filter+sort duplicated verbatim | DRY — reuse existing query | — |
| 2.3 | Open | `src/components/Transcript.tsx` | Animated dots JSX duplicated (lines 108–112, 200–204) | DRY — extract component | — |
| 2.4 | Open | `src/__tests__/hooks/useTextToSpeech.test.ts`, `src/__tests__/lib/StreamingAudioPlayer.test.ts` | Audio mock classes duplicated across test files | DRY — shared test utilities | — |
| **3. Misplaced Helpers** | | | | | |
| 3.1 | Open | `src/components/Transcript.tsx` | `cleanDisplayText()` — pure text processing in component file | Separation of concerns; testability | — |
| 3.2 | Open | `src/components/VoiceButton.tsx` | `MicIcon()`/`SpeakerIcon()` inline SVG icons | Component organization | — |
| 3.3 | Open | `convex/agent.ts`, `convex/data.ts` | Date/time helpers scattered across backend files | Consolidate into `convex/lib/dates.ts` | — |
| 3.4 | Open | `src/components/Transcript.tsx` | Message filtering logic with magic string `"Hi!"` inline in JSX | Extract utility function; no magic strings | — |
| **4. Code Quality** | | | | | |
| 4.1 | Open | `src/App.tsx` | 8 refs managing implicit state machine | Encapsulate complex state in custom hook | — |
| 4.2 | Open | `convex/chat.ts`, `convex/agent.ts`, `convex/data.ts` | Inconsistent error handling (throw vs `{success:false}` vs silent return) | Consistent error strategy per layer | — |
| 4.3 | Open | `convex/data.ts` | Sequential DB inserts in seed data — no `Promise.all` | Batch independent async operations | — |
| 4.4 | Fixed | `src/__tests__/components/*.test.tsx` | Weak assertions — `.toBeDefined()` on `getByText()` always passes | Use `.toBeInTheDocument()` (jest-dom) | 3659fb4 |
| 4.5 | Open | `src/__tests__/hooks/useTextToSpeech.test.ts` | Conditional assertion silently passes when metrics don't fire | Always assert; no conditional expects | — |
| 4.6 | Open | `src/__tests__/components/*.test.tsx` | Redundant `afterEach(cleanup)` — RTL auto-cleans | Remove unnecessary boilerplate | — |
| **5. Naming & Consistency** | | | | | |
| 5.1 | Open | `src/App.tsx` | `messageSentMsRef` ambiguous — should be `messageSentAtMsRef` | Descriptive naming; avoid ambiguity | — |
| 5.2 | Open | `convex/agent.ts`, `convex/data.ts`, `convex/dashboard.ts` | Three different names for same date concept | Consistent naming across modules | — |
| 5.3 | Open | `convex/agent.ts` | Inconsistent tool variable naming (`Tool` suffix vs. none) | Consistent naming convention | — |
| **6. Bugs & Race Conditions** | | | | | |
| 6.1 | Fixed | `src/hooks/useTextToSpeech.ts` | Background receive loop not cancelled on rapid `prepare()` calls | Cancel stale async work; AbortController | 841e8e5 |
| 6.2 | Fixed | `src/hooks/useTextToSpeech.ts` | Unsafe `window.speechSynthesis` access — missing null check in `play()` | Defensive programming; consistent null checks | 05c04d9 |
| 6.3 | Open | `src/hooks/useSpeechRecognition.ts` | Error events swallowed — `.error` property discarded | Log/expose error details | — |
| 6.4 | Open | `src/hooks/useSpeechRecognition.ts` | `onResult`/`onEnd` in deps recreate `start` every render | Stabilize callbacks with refs | — |
| **7. Security** | | | | | |
| 7.1 | Fixed | `convex/chat.ts` | Deprecated `synthesizeSpeech` still client-callable, exposes API key | Principle of least privilege; use `internalAction` | 8b2fdc3 |
| 7.2 | Fixed | `convex/agent.ts` | No input length limits on agent tool Zod schemas | Input validation; OWASP — injection prevention | 602e59d |
| 7.3 | Fixed | `convex/data.ts` | No date string format validation in backend mutations | Input validation at system boundaries | bd40f7a |
| 7.4 | Skipped | `convex/sessions.ts`, `convex/chat.ts`, `convex/dashboard.ts` | No authentication — all public mutations/queries callable by any client | OWASP A01 — Broken Access Control | — (demo app, auth requires infrastructure) |
| 7.5 | Fixed | `convex/chat.ts:14` | No prompt length limit on `sendMessage` mutation — `v.string()` accepts arbitrary size | OWASP A04 — Insecure Design; input validation | 2f7083c |
| 7.6 | Fixed | `convex/data.ts:209-218` | Unbounded array growth in `addPrepQuestion` — no limit on `prepQuestions` array size | Resource exhaustion prevention | cd76187 |
| 7.7 | Fixed | `convex/agent.ts:215` | Unbounded `limit` param in `getSymptomHistoryTool` — `.collect()` loads all then slices | OWASP A04 — resource exhaustion; bound query params | 93da1ef |
| 7.8 | Fixed | `index.html` | Missing Content-Security-Policy and security headers — no CSP, X-Frame-Options, X-Content-Type-Options | OWASP A05 — Security Misconfiguration | b077bca |
| 7.9 | Fixed | `convex/chat.ts:102-103` | Cartesia API error body forwarded to client — information disclosure | OWASP A09 — Security Logging & Monitoring Failures | 8b2fdc3 (resolved by 1.1 deletion) |
| 7.10 | Fixed | `convex/agent.ts:92` | Unvalidated `scheduledTime` format — `z.string()` accepts any value, not `HH:MM` | Input validation at system boundaries | 690f13d |
| 7.11 | Skipped | `convex/chat.ts`, `convex/sessions.ts` | No rate limiting on `sendMessage` or `createSession` — LLM API abuse vector | OWASP A04 — Insecure Design; rate limiting | — (demo app, requires rate-limit infrastructure) |
| 7.12 | Fixed | `src/hooks/useTextToSpeech.ts` | 11 verbose `console.error`/`console.warn` calls in production — leaks stack traces | OWASP A09 — information disclosure via error logging | c1204d2 |
| **8. Test Quality** | | | | | |
| 8.1 | Fixed | `src/__tests__/components/*.test.tsx` | `.toBeDefined()` misuse widespread across all component tests | Meaningful assertions | 3659fb4 |
| 8.2 | Open | `src/__tests__/components/*.test.tsx` | `afterEach(cleanup)` redundant in all 4 component test files | Remove dead test boilerplate | — |
| 8.3 | Open | `src/hooks/useSpeechRecognition.ts` | No tests for error paths (error, abort, permission-denied) | Test error paths and edge cases | — |
| 8.4 | Open | `src/lib/StreamingAudioPlayer.ts` | No test for `stop()` releasing AudioContext | Test resource cleanup | — |
| **9. Accessibility** | | | | | |
| 9.1 | Open | `src/components/Mascot.tsx` | Contradictory attributes: `role="img"` + `aria-hidden="true"` | WCAG — consistent decorative image semantics | — |
| 9.2 | Open | `src/App.tsx` | No `<main>` landmark — screen readers can't jump to content | WCAG 1.3.1 — use landmark elements | — |
| **10. Configuration & CI/CD** | | | | | |
| 10.1 | Open | `convex/tsconfig.json` | Missing `noUnusedLocals`/`noUnusedParameters` | Strict TypeScript across all packages | — |
| 10.2 | Open | `.husky/pre-commit` | Pre-commit runs full CI suite (~30s) | Use `lint-staged` for fast pre-commit | — |
| 10.3 | Open | `.github/workflows/ci.yml` | Deploy job rebuilds from scratch — no artifact reuse | CI — cache/reuse build artifacts | — |
| 10.4 | Open | `.github/workflows/ci.yml` | Node version not pinned (uses `20` not `20.x.y`) | Pin exact versions for reproducibility | — |
| **11. Schema Design** | | | | | |
| 11.1 | Open | `convex/schema.ts`, `convex/data.ts` | `profileId` write-only field — never read | Remove dead schema fields | — |
| 11.2 | Open | `convex/schema.ts` | `category`/`status` are untyped `v.string()` — no enforcement | Use `v.union(v.literal(...))` for enums | — |
| 11.3 | Open | `convex/schema.ts`, `convex/sessions.ts`, `convex/dashboard.ts` | Inconsistent `sessionId` typing — `v.string()` vs `v.id("sessions")` | Consistent ID typing throughout | — |
| 11.4 | Fixed | `convex/schema.ts` | Missing compound index `["sessionId", "dateTime"]` on appointments | Index-backed filtering > JS filtering | 26acba6 |
| 11.5 | Open | `convex/data.ts` | `getAllTasks` returns in arbitrary order — used for timeline | Explicit sort or ordered index | — |
| **12. E2E Test Issues** | | | | | |
| 12.1 | Fixed | `e2e/*.spec.ts` (all 7) | All E2E tests incompatible with "Tap to start" flow — will timeout | Tests must match app UX flow | 0672c84 |
| 12.2 | Fixed | `e2e/session.spec.ts` | Session restore test contradicts "always fresh session" logic | Test actual behavior, not assumed | 0672c84 |
| 12.3 | Open | `e2e/text-chat.spec.ts`, `e2e/session.spec.ts` | CSS class selectors couple tests to Tailwind implementation | Use `data-testid` or semantic selectors | — |
| 12.4 | Open | `e2e/latency.spec.ts` | Latency test has no failure threshold — can never regress | Set performance budgets | — |
| **13. Frontend Bugs** | | | | | |
| 13.1 | Fixed | `src/components/TextInput.tsx` | `onSend(text)` sends untrimmed — guard checks `.trim()` but sends raw | Trim before passing to callback | 4fa9b31 |
| 13.2 | Fixed | `src/main.tsx` | No runtime validation of `VITE_CONVEX_URL` — `as string` hides undefined | Fail fast on missing env vars | 0aabf28 |
| 13.3 | Open | `src/lib/extractCompleteSentences.ts` | Regex fails on abbreviations (`Dr.`), ellipsis (`...`), concatenated words | Robust sentence boundary detection | — |
| **14. Backend Test Coverage** | | | | | |
| 14.1 | Open | `convex/__tests__/` | Only `sessions.ts` tested — `data.ts`, `chat.ts`, `agent.ts`, `dashboard.ts` untested (~400 LOC) | Test critical business logic | — |
| **15. Simplifications (S1–S50)** | | | | | |
| S1 | Open | `src/App.tsx` | Combine 8 refs into single object ref | Reduce ref sprawl; cohesive state | — |
| S2 | Open | `src/App.tsx` | `handleMicToggle` — replace if/else chain with lookup map | Table-driven dispatch | — |
| S3 | Open | `src/App.tsx` | Inline `isReady` — used once | Remove trivial intermediate variables | — |
| S4 | Open | `src/App.tsx` | Deduplicate `messages.filter(assistant)` — 3 occurrences | DRY — memoize repeated computation | — |
| S5 | Open | `src/App.tsx` | Simplify early-hide branching to ternary | Concise conditional assignment | — |
| S6 | Open | `src/App.tsx` | Remove `handleMetrics` wrapper — inline DEV-only log | Remove unnecessary abstraction | — |
| S7 | Open | `src/App.tsx` | Consolidate `handleReset` ref resets → `Object.assign` | Batch related state updates | — |
| S8 | Open | `src/components/Transcript.tsx` | Extract `<LoadingDots />` component — duplicated JSX | DRY — extract component | — |
| S9 | Open | `src/components/Transcript.tsx` | Combine 3 `.filter()` chains into single pass | Reduce array iterations | — |
| S10 | Open | `src/components/Transcript.tsx` | Replace manual reverse loop with `findLastIndex` | Use standard library methods | — |
| S11 | Open | `src/components/Transcript.tsx` | Replace `msgCountRef` + effect with render-time comparison | Simpler state tracking | — |
| S12 | Open | `src/hooks/useTextToSpeech.ts` | Hoist TTS output format config to module constant | Extract static config | — |
| S13 | Open | `src/hooks/useTextToSpeech.ts` | Unify audio byte conversion (ArrayBuffer vs typed array) | Normalize input early | — |
| S14 | Open | `src/hooks/useTextToSpeech.ts` | Hoist `setIsReady(false)` before if/else in `play()` | DRY — hoist common branch logic | — |
| S15 | Open | `src/hooks/useTextToSpeech.ts` | Inline `closeWs` into `stop` — only caller | Remove single-use wrapper | — |
| S16 | Open | `src/hooks/useSpeechRecognition.ts` | Merge `onend`/`onerror` handlers — identical bodies | DRY — merge identical handlers | — |
| S17 | Open | `src/hooks/useSpeechRecognition.ts` | `Object.assign` for recognition config properties | Batch property assignment | — |
| S18 | Open | `src/components/VoiceButton.tsx` | Replace nested ternaries with config map | Table-driven UI config | — |
| S19 | Open | `src/components/StatusPanel.tsx` | Create `Date` once instead of twice for appointment display | Cache computed values | — |
| S20 | Open | `src/components/StatusPanel.tsx` | Extract task status icon into a lookup | Table-driven rendering | — |
| S21 | Open | `convex/agent.ts` | Remove `AnyTool = any` type alias — silences TypeScript | Avoid `any`; let inference work | — |
| S22 | Open | `convex/agent.ts` | Extract `sessionTool()` wrapper — 15 tools repeat boilerplate | DRY — higher-order helper | — |
| S23 | Fixed | `convex/agent.ts` | Simplify `getLanguageModel` — switch overkill for 1 provider | Remove dead branches (with 1.3) | 16cf217 (resolved by 1.3) |
| S24 | Open | `convex/agent.ts` | Inline explicit handler arg types — Zod infers them | Don't Repeat Yourself; trust inference | — |
| S25 | Open | `convex/data.ts`, `convex/dashboard.ts` | Use `.first()` instead of `.collect()[0]` | Use purpose-built query API | — |
| S26 | Open | `convex/data.ts` | Chain filter directly in `getActiveMedications` | Remove unnecessary intermediate variable | — |
| S27 | Open | `convex/data.ts` | Simplify `getTaskByTitle` — deduplicate query branches | Reduce branching complexity | — |
| S28 | Open | `convex/data.ts` | Data-drive medication seed inserts — array + loop | Data-driven iteration over repetition | — |
| S29 | Open | `convex/data.ts` | Simplify `addPrepQuestion` — inline optional chaining | Remove trivial intermediate variable | — |
| S30 | Open | `convex/chat.ts` | Consolidate `generateResponse`/`generateGreeting` | DRY — extract shared logic | — |
| S31 | Open | `convex/dashboard.ts` | Use `.first()` for profile query | Use purpose-built query API | — |
| S32 | Open | `convex/dashboard.ts` | Reuse `getUpcomingAppointments` from `data.ts` | DRY — reuse existing query | — |
| S33 | Open | `src/__tests__/components/*.test.tsx` | Remove all `afterEach(cleanup)` — RTL auto-cleans | Remove dead test boilerplate | — |
| S34 | Open | `src/__tests__/components/VoiceButton.test.tsx` | `test.each` for status/style tests | Parametrize repetitive tests | — |
| S35 | Open | `src/__tests__/components/VoiceButton.test.tsx` | `test.each` for aria-label tests | Parametrize repetitive tests | — |
| S36 | Open | `src/__tests__/components/VoiceButton.test.tsx` | Extract `renderVoiceButton` helper | DRY — shared test setup | — |
| S37 | Open | `src/__tests__/hooks/useTextToSpeech.test.ts` | Consolidate `installAudioMocks`/`installSpeechMocks`/`removeMocks` | DRY — merge related setup/teardown | — |
| S38 | Open | `src/__tests__/hooks/useTextToSpeech.test.ts` | Replace `removeMocks` with loop | Batch cleanup operations | — |
| S39 | Open | `src/__tests__/hooks/useTextToSpeech.test.ts`, `src/__tests__/lib/StreamingAudioPlayer.test.ts` | Share `MockAudioBufferSourceNode` between test files | DRY — shared test mocks | — |
| S40 | Open | `src/__tests__/components/Header.test.tsx` | Use `test.each` instead of manual loop | Parametrize repetitive tests | — |
| S41 | Open | `e2e/*.spec.ts` | Extract shared `beforeEach` setup into Playwright fixture | DRY — test fixture pattern | — |
| S42 | Open | `e2e/text-chat.spec.ts`, `e2e/session.spec.ts` | Replace CSS class locators with semantic selectors | Resilient test selectors | — |
| S43 | Open | `e2e/dashboard.spec.ts` | Remove redundant `{ timeout: 10000 }` — use config default | Configure once, not per assertion | — |
| S44 | Open | `vite.config.ts` | Simplify conditional entry point for `ui-kit` | Reduce config complexity | — |
| S45 | Open | `.husky/pre-commit` | Replace full CI with `lint-staged` | Fast pre-commit hooks | — |
| S46 | Open | `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Combine tsconfig references — reduce to 2 configs | Minimal config files | — |
| S47 | Open | `src/lib/extractCompleteSentences.ts` | Remove explicit return type — let TypeScript infer | Trust type inference | — |
| S48 | Open | `src/lib/StreamingAudioPlayer.ts` | Simplify `stop()` — use `.forEach` for source cleanup | Concise iteration | — |
| S49 | Open | `src/lib/audioTelemetry.ts` | Remove `PipelineTimings` type — only used in DEV-only log (with S6) | Remove dead types | — |
| S50 | Open | `src/components/Mascot.tsx` | Remove contradictory `role="img"` | WCAG — consistent semantics | — |
| **16. Simplifications (S51–S100)** | | | | | |
| S51 | Open | `src/App.tsx` | Extract `getTzOffset()` helper — duplicated `getTimezoneOffset()` | DRY — extract repeated expression | — |
| S52 | Open | `src/App.tsx` | Use `.at(-1)` instead of `array[array.length - 1]` (3 sites) | Modern array access | — |
| S53 | Open | `src/App.tsx` | Simplify TTS target search with `findLast()` | Use standard library methods | — |
| S54 | Open | `src/hooks/useTextToSpeech.ts` | Remove unused `isReady` state — never consumed by App.tsx | Dead code elimination | — |
| S55 | Open | `src/App.tsx` | Simplify `resetRequested` watcher effect | Minimal effect bodies | — |
| S56 | Open | `src/components/Transcript.tsx` | Move `cleanDisplayText`/`stripInlineJson` to `src/lib/` | Separation of concerns | — |
| S57 | Open | `src/components/Transcript.tsx` | Use named constant for `"Hi!"` magic string | No magic strings | — |
| S58 | Open | `src/components/Transcript.tsx` | Replace role className ternary with lookup | Table-driven rendering | — |
| S59 | Open | `src/components/Transcript.tsx` | Inline `handleExpand` — single-use function | Remove unnecessary named function | — |
| S60 | Open | `src/components/Mascot.tsx` | Combine `statusSvg` + `statusAnimation` into single Record | Cohesive data structure | — |
| S61 | Open | `src/components/Mascot.tsx` | Remove unnecessary `as const` from `sizeClasses` | Minimal type annotations | — |
| S62 | Open | `src/components/VoiceButton.tsx` | Remove `isActive`/`isSpeaking` intermediaries — use status directly | Remove trivial intermediate variables | — |
| S63 | Open | `src/components/StatusPanel.tsx` | Single-pass task grouping instead of double filter | Reduce array iterations | — |
| S64 | Open | `src/components/StatusPanel.tsx` | Inline `TodayOverview` interface — used once | Inline single-use types | — |
| S65 | Open | `src/hooks/useSpeechRecognition.ts` | Simplify `isSupported` with nullish coalescing | Concise browser feature detection | — |
| S66 | Open | `src/hooks/useSpeechRecognition.ts` | Remove `SpeechRecognitionReturn` interface — infer return type | Trust type inference | — |
| S67 | Open | `src/lib/StreamingAudioPlayer.ts` | Extract `source.onended` to private method — duplicated at 2 sites | DRY — extract method | — |
| S68 | Open | `src/lib/StreamingAudioPlayer.ts` | Remove `bufferingDone` field — derive from state | Single source of truth | — |
| S69 | Open | `src/lib/StreamingAudioPlayer.ts` | Combine 4 array iterations in `getMetrics()` into single loop | Reduce array passes | — |
| S70 | Open | `convex/agent.ts` | Remove `LanguageModel` import — infer return type | Trust type inference | — |
| S71 | Fixed | `convex/agent.ts` | Remove `console.log` from `getLanguageModel` — noise in prod logs | No debug logging in production paths | 16cf217 (resolved by 1.3) |
| S72 | Open | `convex/agent.ts` | Standardize tool variable naming (drop `Tool` suffix) | Consistent naming convention | — |
| S73 | Open | `convex/agent.ts` | Remove/fix `as Id<"sessions">` cast in `resetConversationTool` | Type-safe return from `resolveSessionId` | — |
| S74 | Open | `convex/agent.ts` | Early return in `getMedicationsTool` to reduce nesting | Early return pattern | — |
| S75 | Open | `convex/agent.ts` | Simplify `logSymptomsTool` return — echoes input unnecessarily | Return only what the caller needs | — |
| S76 | Open | `convex/agent.ts` | Flatten appointment lookup ternary in `generateAppointmentSummaryTool` | Simplify conditional expressions | — |
| S77 | Fixed | `convex/chat.ts` | Extract default voice ID UUID to named constant | No magic strings/UUIDs | f94e4da |
| S78 | Fixed | `convex/chat.ts` | Remove empty `args: {}` from `getTtsConfig` | Remove redundant defaults | f94e4da |
| S79 | Open | `convex/dashboard.ts` | Inline `today` variable — used once | Remove trivial intermediate variables | — |
| S80 | Open | `convex/data.ts` | Use `.take(limit)` instead of `.collect()` + `.slice()` | Limit at query level, not JS level | — |
| S81 | Open | `convex/data.ts` | Data-drive today's standalone task inserts — array + loop | Data-driven iteration | — |
| S82 | Open | `convex/data.ts` | Data-drive appointment seed inserts — array + loop | Data-driven iteration | — |
| S83 | Open | `convex/data.ts` | Data-drive symptom log seed inserts — array + loop | Data-driven iteration | — |
| S84 | Open | `src/__tests__/components/Transcript.test.tsx` | Extract `msg()` helper into shared test utils | DRY — shared test utilities | — |
| S85 | Open | `src/__tests__/components/TextInput.test.tsx` | Extract `renderTextInput` helper | DRY — shared test setup | — |
| S86 | Open | `src/__tests__/hooks/useSpeechRecognition.test.ts` | Combine `createMockConstructor` + `installMock` | DRY — merge related functions | — |
| S87 | Open | `src/__tests__/components/Transcript.test.tsx` | `test.each` for alignment tests (user right, assistant left) | Parametrize repetitive tests | — |
| S88 | Open | `src/__tests__/components/Transcript.test.tsx` | `test.each` for bubble color tests (user purple, assistant white) | Parametrize repetitive tests | — |
| S89 | Open | `src/__tests__/components/VoiceButton.test.tsx` | Combine processing disabled + click-no-effect tests | Merge related assertions | — |
| S90 | Open | `e2e/voice-button.spec.ts` | Extract `test.skip(browserName!=="chromium")` to fixture | DRY — test fixture pattern | — |
| S91 | Open | `e2e/session.spec.ts` | Extract `localStorage.getItem` evaluator helper | DRY — shared test helper | — |
| S92 | Open | `e2e/responsive.spec.ts` | Parametrize viewport tests with `test.use()` | Parametrize repetitive tests | — |
| S93 | Open | `e2e/text-chat.spec.ts` | Extract "send message + wait" helper | DRY — shared test helper | — |
| S94 | Open | `playwright.config.ts` | Extract `process.env.CI` to `IS_CI` constant | DRY — don't repeat env checks | — |
| S95 | Open | `playwright.config.ts` | Playwright projects array via `.map()` | Data-driven config | — |
| S96 | Open | `src/components/VoiceButton.tsx` | Inline `VoiceButtonProps` interface — used once | Inline single-use types | — |
| S97 | Open | `src/components/TextInput.tsx` | Inline `TextInputProps` interface — used once | Inline single-use types | — |
| S98 | Open | `src/hooks/useTextToSpeech.ts` | Inline `TtsConfig` interface — used once as ref type | Inline single-use types | — |
| S99 | Open | `src/hooks/useTextToSpeech.ts` | Inline `CartesiaWS` type alias — used once | Inline single-use types | — |
| S100 | Open | `src/__tests__/hooks/useSpeechRecognition.test.ts` | Remove `MockInstance` interface — let TypeScript infer | Trust type inference | — |

**Totals:** 159 issues — 130 Open, 0 In-progress, 27 Fixed, 2 Skipped

---

## 1. Unused Code

### 1.1 `synthesizeSpeech` — deprecated, never called

**File:** `convex/chat.ts:62-103`

Marked `@deprecated` in favor of client-side Cartesia WebSocket TTS. The frontend uses `getTtsConfig` + the Cartesia SDK directly. This 40-line action is dead code and still exposes a server-side API key in an exported (client-callable) action.

**Recommendation:** Delete the function. If needed for reference, it lives in git history.

### 1.2 `convex-helpers` package — never imported

**File:** `package.json:31`

```json
"convex-helpers": "^0.1.103"
```

No file in the codebase imports from `convex-helpers`.

**Recommendation:** `npm uninstall convex-helpers` to reduce bundle/install size.

### 1.3 `@ai-sdk/cerebras` — dead code path

**Files:** `convex/agent.ts:5` (import), `convex/agent.ts:407-409` (switch case)

The `cerebras` provider is imported and wired into `getLanguageModel()`, but it only activates when `LLM_PROVIDER=cerebras` — an env var that is never set. The import unconditionally pulls the package into the Convex bundle.

```ts
import { cerebras } from "@ai-sdk/cerebras"; // always bundled
// ...
case "cerebras":
  return cerebras(model ?? "gpt-oss-120b");
```

**Recommendation:** Remove the import, the switch case, and `@ai-sdk/cerebras` from `package.json`. Re-add when/if Cerebras is actually needed.

---

## 2. Duplicated Code

### 2.1 Date formatting — three implementations of the same logic

| Location | Function | Implementation |
|---|---|---|
| `convex/agent.ts:23-25` | `todayISO()` | `new Date().toISOString().split("T")[0]` |
| `convex/data.ts:6-8` | `formatDate(date)` | `date.toISOString().split("T")[0]` |
| `convex/dashboard.ts:7` | inline | `new Date().toISOString().split("T")[0]` |

**Recommendation:** Extract a single `toISODate()` into `convex/lib/dates.ts` and import everywhere.

### 2.2 Appointment filtering — identical filter+sort

| Location | Code |
|---|---|
| `convex/data.ts:188-190` | `.filter((a) => a.dateTime >= now).sort((a, b) => a.dateTime - b.dateTime)` |
| `convex/dashboard.ts:31-33` | `.filter((a) => a.dateTime >= now).sort((a, b) => a.dateTime - b.dateTime)` |

**Recommendation:** Extract into `data.ts` as a shared `getUpcomingAppointments` or reuse the existing query from `dashboard.ts`.

### 2.3 Animated dots — same loading indicator twice

| Location | Lines |
|---|---|
| `src/components/Transcript.tsx` | 80-83 (empty state) |
| `src/components/Transcript.tsx` | 172-176 (processing state) |

Both render three bouncing dots with the same classes and delays.

**Recommendation:** Extract a `<LoadingDots />` component.

### 2.4 Audio mocks — duplicated across test files

| Location | What |
|---|---|
| `src/__tests__/hooks/useTextToSpeech.test.ts:64-113` | `MockAudioBufferSourceNode`, `MockAudioBuffer`, `MockAudioContext` |
| `src/__tests__/lib/StreamingAudioPlayer.test.ts:9-57` | `MockAudioBufferSourceNode`, `MockAudioContext` |

Nearly identical mock classes with minor variations.

**Recommendation:** Extract shared audio mocks into `src/__tests__/helpers/audioMocks.ts`.

---

## 3. Misplaced Helpers

### 3.1 `cleanDisplayText()` — text processing in a component

**File:** `src/components/Transcript.tsx:13-18`

```ts
function cleanDisplayText(text: string): string {
  return text
    .replace(/<emotion\s+value="[^"]*"\s*\/>/g, "")
    .replace(/\[laughter\]/g, "")
    .trim();
}
```

This is pure text transformation with no UI dependency.

**Recommendation:** Move to `src/lib/textUtils.ts` for testability and reuse.

### 3.2 `MicIcon()` / `SpeakerIcon()` — inline SVG icons

**File:** `src/components/VoiceButton.tsx:37-63`

Two icon components defined inside the VoiceButton module.

**Recommendation:** Move to `src/components/icons/` if they're reused, or keep as-is if truly one-off (low priority).

### 3.3 Date/time helpers scattered across backend

| Helper | Location |
|---|---|
| `todayISO()` | `convex/agent.ts:23-25` |
| `formatDate()` | `convex/data.ts:6-8` |
| `daysFromNow()` | `convex/data.ts:10-14` |
| `localTime()` | `convex/data.ts:23-33` |

**Recommendation:** Consolidate into `convex/lib/dates.ts`.

### 3.4 Message filtering logic inline in Transcript

**File:** `src/components/Transcript.tsx:50-55`

```ts
const visibleMessages = messages
  .filter((m) => m.role === "user" || m.role === "assistant")
  .filter((m, i) => !(i === 0 && m.role === "user" && m.text.trim() === "Hi!"))
  .filter((m) => m.key !== hiddenMessageKey);
```

Multi-step filtering with a magic-string check (`"Hi!"`) inlined in JSX logic.

**Recommendation:** Extract to a `getVisibleMessages()` utility for testability.

---

## 4. Code Quality Improvements

### 4.1 Ref sprawl in `App.tsx` — implicit state machine

**File:** `src/App.tsx:25-35`

Eight `useRef` values manage interleaved state that collectively forms an undocumented state machine:

```
lastAssistantCountRef, hasInitializedRef, messageSentMsRef,
spokenMsgRef, preparePhaseRef, userInteractedRef,
startListeningRef, speechSupportedRef
```

**Recommendation:** Consolidate into a `useVoiceSession()` custom hook that encapsulates the refs and their transitions, returning a clean API to the component.

### 4.2 Inconsistent error handling in Convex backend

| Pattern | Example |
|---|---|
| Throws | `convex/chat.ts:67` — `throw new Error("Transcript is empty...")` |
| Returns `{success: false}` | `convex/agent.ts:79` — `return { success: false, message: "Task not found" }` |
| Silently returns `undefined` | `convex/data.ts:213` — `if (!appointment) return;` |

The tool handlers (agent.ts) use `{success: false}` which makes sense for LLM-facing tools, but `addPrepQuestion` (data.ts:211-218) silently swallows the "appointment not found" case with a bare `return`. The calling tool in `agent.ts:256` already guards this, but the mutation itself gives no feedback.

**Recommendation:** Pick one pattern per layer. For `data.ts` mutations, consider throwing on invalid IDs. For agent tools, keep `{success: false}` since the LLM needs structured responses.

### 4.3 Sequential DB inserts in seed data

**File:** `convex/data.ts:298-311, 346-357`

```ts
for (let cd = 3; cd <= 7; cd++) {
  // ...
  await ctx.db.insert("treatmentTasks", { ... });
}
```

Each iteration awaits separately. In Convex mutations these are all in-transaction, but the sequential awaits are slower than parallel inserts.

**Recommendation:** Use `Promise.all()` for batches of independent inserts:
```ts
await Promise.all(
  [3, 4, 5, 6, 7].map((cd) => ctx.db.insert("treatmentTasks", { ... }))
);
```

### 4.4 Weak test assertions — `.toBeDefined()` vs `.toBeInTheDocument()`

**File:** `src/__tests__/components/Transcript.test.tsx:24, 31, 45, 50, 55`

```ts
expect(screen.getByText(/tap to start/i)).toBeDefined();
expect(container.querySelector(".animate-think")).toBeDefined();
```

`screen.getByText()` throws if the element is missing, so `.toBeDefined()` is always true — it never actually fails. Similarly, `querySelector` returns `null` (not `undefined`) when not found, so `.toBeDefined()` passes even when the element is absent.

**Recommendation:** Use `.toBeInTheDocument()` (from `@testing-library/jest-dom`) for DOM presence checks, or `.not.toBeNull()` for querySelector results.

### 4.5 Conditional assertion silently passes

**File:** `src/__tests__/hooks/useTextToSpeech.test.ts:329-333`

```ts
if (onMetrics.mock.calls.length > 0) {
  const metrics = onMetrics.mock.calls[0][0];
  expect(metrics.chunks.length).toBeGreaterThan(0);
}
```

If `onMetrics` never fires, the test passes with zero assertions. This defeats the purpose of the test.

**Recommendation:** Assert unconditionally, or use `expect(onMetrics).toHaveBeenCalled()` first.

### 4.6 Redundant `afterEach(cleanup)` in component tests

**File:** `src/__tests__/components/Transcript.test.tsx:9`

```ts
afterEach(cleanup);
```

`@testing-library/react` auto-cleans after each test in Vitest/Jest environments.

**Recommendation:** Remove the manual cleanup call.

---

## 5. Naming & Consistency

### 5.1 `messageSentMsRef` — ambiguous name

**File:** `src/App.tsx:27`

The name could mean "message sent in milliseconds" (a duration) rather than its actual meaning: "timestamp when the message was sent."

**Recommendation:** Rename to `messageSentAtMsRef`.

### 5.2 Three names for the same date concept

| File | Name |
|---|---|
| `convex/agent.ts` | `todayISO()` |
| `convex/data.ts` | `formatDate()` |
| `convex/dashboard.ts` | inline |

All produce `YYYY-MM-DD` from a Date.

**Recommendation:** Standardize on one name (e.g., `toISODate()`) in a shared module.

### 5.3 Inconsistent tool variable naming in `convex/agent.ts`

Some tool variables match their registration key directly, others use a `Tool` suffix:

| Variable | Registered as |
|---|---|
| `getTodaysTasks` | `getTodaysTasks` |
| `getTasksForDate` | `getTasksForDate` |
| `completeTaskTool` | `completeTask` |
| `createTaskTool` | `createTask` |
| `skipTaskTool` | `skipTask` |
| `getProfileTool` | `getProfile` |
| `getMedicationsTool` | `getMedications` |

**Recommendation:** Pick one convention. Either all variables match their registration key, or all use the `Tool` suffix.

---

## 6. Potential Bugs & Race Conditions

### 6.1 Background receive loop not cancelled on rapid `prepare()` calls

**File:** `src/hooks/useTextToSpeech.ts:110-136`

When `prepare()` is called, it fires a background async IIFE to drain the Cartesia receive stream:

```ts
(async () => {
  for await (const event of ttsCtx.receive()) {
    // appends chunks to player...
  }
  player.markStreamComplete();
})();
```

If `prepare()` is called again before the first stream finishes, `stop()` nulls `playerRef` and closes the WebSocket, but the old async loop still holds a reference to the previous `player` local variable and continues to call `appendChunk()` / `markStreamComplete()` on a stale player. This is a memory leak and can cause spurious `onEnd` callbacks.

**Recommendation:** Track the receive loop with an `AbortController` or a generation counter. On `stop()`, signal the loop to bail out.

### 6.2 Unsafe `window.speechSynthesis` access in `play()`

**File:** `src/hooks/useTextToSpeech.ts:166`

```ts
window.speechSynthesis.speak(utterance); // no null check
```

Contrast with line 61 which safely uses `window.speechSynthesis?.cancel()`. If the browser doesn't support `speechSynthesis`, `play()` will throw.

**Recommendation:** Use optional chaining: `window.speechSynthesis?.speak(utterance)`, or guard with a check.

### 6.3 `useSpeechRecognition` swallows errors silently

**File:** `src/hooks/useSpeechRecognition.ts:46-48`

```ts
recognition.onerror = () => {
  recognitionRef.current = null;
  onEnd?.();
};
```

The error event's `.error` property (which contains the reason — `"not-allowed"`, `"network"`, `"aborted"`, etc.) is discarded. The user sees no feedback when speech recognition fails.

**Recommendation:** Accept the error event and expose it:
```ts
recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
  console.warn("[STT] error:", e.error);
  recognitionRef.current = null;
  onEnd?.();
};
```

### 6.4 `onResult`/`onEnd` in `useSpeechRecognition` deps cause recreation on every render

**File:** `src/hooks/useSpeechRecognition.ts:53`

```ts
const start = useCallback(() => {
  // ...
}, [isSupported, onResult, onEnd]);
```

`onResult` and `onEnd` are inline arrow functions in `App.tsx`, so they're new references every render. This means `start` is recreated every render, which in turn causes `handleMicToggle` to be recreated. Not a functional bug, but defeats memoization.

**Recommendation:** Use refs for the callbacks (same pattern as `useTextToSpeech`), or wrap the callers in `useCallback`.

---

## 7. Security

### 7.1 Deprecated `synthesizeSpeech` still client-callable

**File:** `convex/chat.ts:63`

This is exported as an `action` (not `internalAction`), so any client can call it. It reads `CARTESIA_API_KEY` from env and makes outbound API calls on the server's behalf. Even though the frontend no longer uses it, it remains an open endpoint.

**Recommendation:** Delete it, or at minimum change to `internalAction` to prevent client access.

### 7.2 No input length limits on agent tool arguments

**File:** `convex/agent.ts` — all tool `z.object()` schemas

None of the Zod schemas have `.max()` constraints. An LLM hallucination or prompt injection could pass extremely long strings (e.g., a 1MB `title` or `question`), which would be stored directly in the database.

Examples:
- `createTaskTool` — `title: z.string()` (no max)
- `addAppointmentQuestionTool` — `question: z.string()` (no max)
- `logSymptomsTool` — `symptoms: z.array(z.string())` (unbounded array)

**Recommendation:** Add reasonable `.max()` limits:
```ts
title: z.string().max(200),
question: z.string().max(500),
symptoms: z.array(z.string().max(100)).max(20),
```

### 7.3 No date string validation in backend mutations

**File:** `convex/data.ts:109, 149, 153`

`scheduledDate` and `date` are accepted as `v.string()` with no format validation. Values like `"not-a-date"` or `"<script>"` would be stored verbatim.

**Recommendation:** Validate date format in the mutation handler:
```ts
if (!/^\d{4}-\d{2}-\d{2}$/.test(args.scheduledDate)) {
  throw new Error("Invalid date format");
}
```

### 7.4 No authentication — all public endpoints callable by any client

**Files:** `convex/sessions.ts:12` (`createSession`), `convex/chat.ts:13` (`sendMessage`), `convex/dashboard.ts:4` (`getTodayOverview`), `convex/chat.ts:109` (`getTtsConfig`)

None of the public-facing mutations, queries, or actions check `ctx.auth.getUserIdentity()`. Any client with the Convex deployment URL can:
- Create unlimited sessions (each triggers LLM greeting generation)
- Send messages to any thread (consuming LLM API tokens)
- Read any session's dashboard data
- Obtain the Cartesia API key via `getTtsConfig`

**Impact:** Critical for a production app — an attacker can exhaust LLM API quota, access other users' data, and obtain third-party API keys.

**Recommendation:** Add auth checks to all public functions:
```ts
export const sendMessage = mutation({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    // verify session ownership...
  },
});
```

### 7.5 No prompt length limit on `sendMessage`

**File:** `convex/chat.ts:14`

The `prompt` argument is `v.string()` with no size constraint. A client can send a multi-megabyte prompt that gets stored in the database and forwarded to the LLM API, consuming tokens and storage.

**Recommendation:** Add length validation:
```ts
args: { threadId: v.string(), prompt: v.string() },
handler: async (ctx, { threadId, prompt }) => {
  if (prompt.length > 5000) throw new Error("Message too long");
```

### 7.6 Unbounded array growth in `addPrepQuestion`

**File:** `convex/data.ts:209-218`

The `addPrepQuestion` mutation appends to the `prepQuestions` array without checking its size. Repeated calls can grow the array indefinitely, bloating the document and degrading query performance.

```ts
const existing = appointment.prepQuestions ?? [];
await ctx.db.patch(appointmentId, {
  prepQuestions: [...existing, question],  // No size check
});
```

**Recommendation:** Cap the array size:
```ts
if (existing.length >= 50) throw new Error("Maximum questions reached");
```

### 7.7 Unbounded `limit` in `getSymptomHistoryTool`

**File:** `convex/agent.ts:215`, `convex/data.ts:166-175`

The Zod schema allows any number for `limit` (`z.number().default(5)`), with no `.max()`. The backend query does `.collect()` (fetching all records) then `.slice(0, limit)` — the limit doesn't reduce the DB read, only the returned result.

**Impact:** An LLM tool call with `limit: 999999` loads all symptom logs into memory before slicing.

**Recommendation:** Add max constraint in Zod and use `.take()` at query level:
```ts
// Tool schema
limit: z.number().int().min(1).max(100).default(5),

// Query
.order("desc").take(Math.min(limit, 100));
```

### 7.8 Missing Content-Security-Policy and security headers

**File:** `index.html` — no CSP meta tag. No `public/_headers` file for Cloudflare Pages.

The app serves no security headers:
- **No CSP** — inline script injection not mitigated
- **No X-Frame-Options** — app can be embedded in iframes (clickjacking)
- **No X-Content-Type-Options** — MIME-type sniffing not prevented
- **No Referrer-Policy** — full URL leaked in referer headers

**Recommendation:** Create `public/_headers`:
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; connect-src 'self' https://*.convex.cloud wss://*.cartesia.ai; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### 7.9 Cartesia API error body forwarded to client

**File:** `convex/chat.ts:102-103`

```ts
const body = await response.text();
throw new Error(`Cartesia API error ${response.status}: ${body}`);
```

The full API error response body is included in the thrown error, which propagates to the client. This can reveal API internals, rate limit details, or server-side configuration.

**Recommendation:** Log the full error server-side, return a generic message to the client:
```ts
console.error(`[Cartesia] ${response.status}: ${body}`);
throw new Error("Text-to-speech service unavailable");
```

### 7.10 Unvalidated `scheduledTime` format

**File:** `convex/agent.ts:92`

```ts
scheduledTime: z.string().optional().describe("Time in HH:MM format"),
```

The `describe()` hint is documentation only — Zod does not enforce the format. Values like `"99:99"`, `"midnight"`, or empty strings pass validation and get stored.

**Recommendation:** Add regex validation:
```ts
scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
```

### 7.11 No rate limiting on public mutations

**Files:** `convex/chat.ts:13` (`sendMessage`), `convex/sessions.ts:12` (`createSession`)

Neither mutation implements rate limiting. A client can:
- Create sessions in a tight loop — each one spawns `initThread` + `generateGreeting` (2 LLM calls)
- Send messages rapidly — each triggers `generateResponse` (1 LLM call)

At $0.80/MTok for Haiku, an attacker sending 1000 long messages can cost ~$40+ in API fees.

**Recommendation:** Use Convex rate limiting (`convex-helpers/server/rateLimit`) or implement a per-IP/session throttle:
```ts
import { rateLimit } from "convex-helpers/server/rateLimit";
const limiter = rateLimit({ interval: 60_000, maxInInterval: 10 });
```

### 7.12 Verbose error logging in production

**File:** `src/hooks/useTextToSpeech.ts` — lines 80, 86, 99, 165, 173, 182, 191, 255, 266, 273

11 `console.error`/`console.warn` calls log full error objects (including stack traces) in all environments. None are guarded by `import.meta.env.DEV`.

**Impact:** Users (or attackers) can open DevTools and see internal error details including WebSocket connection parameters, API response structures, and stack traces that reveal code paths.

**Recommendation:** Guard verbose logging with environment check:
```ts
if (import.meta.env.DEV) console.warn("[TTS] warmup failed:", e);
```

---

## 8. Test Quality (additional findings)

### 8.1 `.toBeDefined()` misuse widespread across all component tests

Beyond `Transcript.test.tsx` (section 4.4), the same anti-pattern appears in:

| File | Lines |
|---|---|
| `src/__tests__/components/Header.test.tsx` | 11, 24 |
| `src/__tests__/components/TextInput.test.tsx` | 10, 15 |
| `src/__tests__/components/VoiceButton.test.tsx` | 12, 46, 83 |

All use `expect(screen.getByText(...)).toBeDefined()` which can never fail.

### 8.2 `afterEach(cleanup)` redundant in all component test files

Present in all four component test files, not just `Transcript.test.tsx`:
- `Header.test.tsx:4`
- `TextInput.test.tsx:4`
- `VoiceButton.test.tsx:4`
- `Transcript.test.tsx:9`

### 8.3 No tests for `useSpeechRecognition` error paths

**File:** `src/hooks/useSpeechRecognition.ts`

The hook has an `onerror` handler (line 46) but there are no test files for this hook at all. The error, abort, and permission-denied cases are completely untested.

### 8.4 No tests for `StreamingAudioPlayer.stop()` releasing AudioContext

**File:** `src/lib/StreamingAudioPlayer.ts:197-209`

`stop()` calls `this.ctx.close()` but no test verifies the AudioContext is actually closed. A leaked AudioContext consumes system audio resources.

---

## 9. Accessibility

### 9.1 Contradictory attributes on Mascot image

**File:** `src/components/Mascot.tsx:41-45`

```tsx
<img
  src={src}
  alt=""
  role="img"
  aria-hidden="true"
/>
```

`alt=""` + `aria-hidden="true"` marks this as decorative (correct), but `role="img"` explicitly tells assistive tech to treat it as a meaningful image. These are contradictory.

**Recommendation:** Remove `role="img"`.

### 9.2 No `<main>` landmark

**File:** `src/App.tsx:290`

The main content area uses `<div className="flex min-w-0 flex-1 flex-col">` instead of a `<main>` element. Screen reader users cannot jump to the primary content.

**Recommendation:** Change the outer content div to `<main>`.

---

## 10. Configuration & CI/CD

### 10.1 Convex `tsconfig.json` missing strict unused-variable checks

**File:** `convex/tsconfig.json`

The frontend `tsconfig.app.json` enables `noUnusedLocals` and `noUnusedParameters`, but the Convex config only has `strict: true` (which doesn't include those). Backend dead code won't be caught by `npm run typecheck`.

**Recommendation:** Add to `convex/tsconfig.json`:
```json
"noUnusedLocals": true,
"noUnusedParameters": true
```

### 10.2 Pre-commit hook runs full CI suite

**File:** `.husky/pre-commit`

```bash
npm run typecheck && npm run lint && npm run test:run
```

This runs typecheck + lint + all tests on every commit, which can take 30+ seconds. Developers are likely to bypass with `--no-verify`.

**Recommendation:** Use `lint-staged` to only check changed files, or limit pre-commit to lint and run full checks in CI only.

### 10.3 Deploy job rebuilds everything from scratch

**File:** `.github/workflows/ci.yml:28-44`

The `deploy` job re-runs `npm ci` and rebuilds the entire project, despite the `check` job already doing this. The build artifact from `check` is not reused.

**Recommendation:** Upload `dist/` as an artifact from `check` and download it in `deploy`, or combine into one job.

### 10.4 Node version not pinned in CI

**File:** `.github/workflows/ci.yml:16`

```yaml
node-version: 20
```

This resolves to the latest Node 20.x, which can change between runs. A minor version bump could introduce subtle behavior changes.

**Recommendation:** Pin to an exact version (e.g., `20.14.0`) or use an `.nvmrc` file.

---

## 11. Schema Design

### 11.1 `profileId` in sessions — write-only field

**File:** `convex/schema.ts:8`, `convex/data.ts:243`

```ts
// schema.ts
profileId: v.optional(v.string()),

// data.ts (only write site)
await ctx.db.patch(sessionId, { profileId: profileId as string });
```

Written once during `seedSessionData` but **never read** anywhere. Queries always look up profiles via the `patientProfiles.by_session` index. This is a dead field.

**Recommendation:** Remove from schema, or implement a use case.

### 11.2 `category` and `status` are untyped strings

**File:** `convex/schema.ts:42-45`

```ts
// "medication" | "appointment" | "logging" | "other"
category: v.string(),
// "pending" | "done" | "skipped"
status: v.string(),
```

The valid values are documented in comments but not enforced. The agent tool `createTaskTool` enforces via Zod enum (`z.enum(["medication", "appointment", "logging", "other"])`), but the Convex mutation accepts any string. A malformed value would be silently stored.

**Recommendation:** Use `v.union(v.literal("pending"), v.literal("done"), v.literal("skipped"))` for `status` and similar for `category`.

### 11.3 Inconsistent ID typing — `v.string()` vs `v.id("sessions")`

**Files:** `convex/schema.ts` (all child tables), `convex/sessions.ts:28`, `convex/dashboard.ts:5,9`

All child tables store `sessionId` as `v.string()`:
```ts
patientProfiles: defineTable({ sessionId: v.string(), ... })
```

But some function args require `v.id("sessions")` then cast:
```ts
// dashboard.ts:5
args: { sessionId: v.id("sessions") },
// dashboard.ts:9
const sid = sessionId as string; // cast away type safety
```

While other functions accept `v.string()`:
```ts
// data.ts:39
args: { sessionId: v.string() },
```

This inconsistency bypasses Convex's ID validation for some paths but not others.

**Recommendation:** Standardize. Either use `v.id("sessions")` everywhere (preferred — lets Convex validate), or use `v.string()` everywhere and document why.

### 11.4 Missing compound index on appointments for time-range queries

**File:** `convex/schema.ts:59` vs `convex/data.ts:188-190`, `convex/dashboard.ts:31-33`

The `appointments` table only has:
```ts
.index("by_session", ["sessionId"])
```

But both `getUpcomingAppointments` (data.ts) and `getTodayOverview` (dashboard.ts) fetch ALL appointments then filter/sort in JavaScript:
```ts
appointments.filter((a) => a.dateTime >= now).sort((a, b) => a.dateTime - b.dateTime)
```

**Recommendation:** Add a compound index to push filtering into the database:
```ts
.index("by_session_dateTime", ["sessionId", "dateTime"])
```

### 11.5 `getAllTasks` returns in arbitrary order

**File:** `convex/data.ts:83-91`

```ts
return await ctx.db
  .query("treatmentTasks")
  .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
  .collect(); // no order specified
```

Used by `getCycleTimelineTool` (agent.ts:318) to build a chronological timeline, but results are not sorted by `scheduledDate`. The timeline may appear scrambled.

**Recommendation:** Sort results or add `.order("asc")` and use the `by_session_date` index.

---

## 12. E2E Test Issues

### 12.1 All E2E tests incompatible with "Tap to start" flow

**Files:** All 7 test files in `e2e/`

Every E2E test waits for `page.getByPlaceholder("Type a message...")` to be visible or enabled as its readiness signal. However, `TextInput` only renders when `started === true` (App.tsx:318), and `started` defaults to `false`. The user must click "Tap to start the conversation" first.

No E2E test clicks this button. All tests will **timeout at 15 seconds in `beforeEach`**.

```ts
// e2e/text-chat.spec.ts:7 — will timeout
await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({
  timeout: 15000,
});
```

**Recommendation:** Add a start step to each test's `beforeEach`:
```ts
await page.getByRole("button", { name: "Tap to start conversation" }).click();
await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({ timeout: 15000 });
```

### 12.2 Session restore test contradicts "always fresh session" logic

**File:** `e2e/session.spec.ts:20-42`

```ts
test("should restore session on page reload", async ({ page }) => {
  // ... gets sessionBefore ...
  await page.reload();
  // ... gets sessionAfter ...
  expect(sessionAfter).toBe(sessionBefore); // ← will fail
});
```

App.tsx:125-134 explicitly creates a fresh session on every mount. The localStorage value is overwritten. `sessionAfter` will be a new ID, not `sessionBefore`.

**Recommendation:** Either restore sessions from localStorage in App.tsx, or fix the test to reflect the actual behavior.

### 12.3 CSS class selectors couple tests to Tailwind implementation

**Files:** `e2e/text-chat.spec.ts:21,44,57`, `e2e/session.spec.ts:56,64`

```ts
page.locator(".bg-purple.text-white") // user message
page.locator(".bg-white.text-gray-900.shadow-sm") // assistant message
```

These selectors break if any Tailwind class changes. A class rename from `bg-white` to `bg-slate-50` breaks all message-related tests.

**Recommendation:** Add `data-testid` attributes to message bubbles:
```tsx
<div data-testid={`message-${message.role}`} className={...}>
```

### 12.4 Latency test asserts timing without thresholds

**File:** `e2e/latency.spec.ts:11-35`

The test measures wall-clock latency but only asserts `totalMs >= speakingMs` (always true by definition). It captures timings as annotations but sets no performance budget. The test can never fail on regressions.

**Recommendation:** Add a maximum acceptable latency:
```ts
expect(speakingMs).toBeLessThan(15000); // time-to-first-audio budget
```

---

## 13. Frontend Bugs

### 13.1 `TextInput` sends untrimmed text

**File:** `src/components/TextInput.tsx:13-14`

```ts
if (!text.trim() || disabled) return;
onSend(text); // sends original, not trimmed
```

The guard checks `text.trim()` but passes the raw `text` with potential leading/trailing whitespace.

**Recommendation:** `onSend(text.trim())`.

### 13.2 No runtime validation of `VITE_CONVEX_URL`

**File:** `src/main.tsx:7`

```ts
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
```

If `.env.local` is missing, `VITE_CONVEX_URL` is `undefined`. The `as string` cast silences TypeScript but `ConvexReactClient` receives `undefined`, causing a cryptic runtime error.

**Recommendation:** Add a guard:
```ts
const url = import.meta.env.VITE_CONVEX_URL;
if (!url) throw new Error("VITE_CONVEX_URL not set — create .env.local");
```

### 13.3 `extractCompleteSentences` regex misses edge cases

**File:** `src/lib/extractCompleteSentences.ts:5`

```ts
const pattern = /[^.!?]*[.!?]+(?:\s|$)/g;
```

This splits on `.`, `!`, `?` followed by whitespace or end-of-string. It fails on:
- Abbreviations: `"Dr. Patel said hello."` → splits after `"Dr."` mid-sentence
- Ellipsis: `"Wait... really?"` → splits after each `.`
- No trailing space: `"Hello.World"` → no match

The LLM-generated text frequently contains abbreviations (`Dr.`, `e.g.`) and ellipses.

**Recommendation:** Use a more robust sentence boundary heuristic that accounts for common abbreviations.

---

## 14. Backend Test Coverage

### 14.1 Only `sessions.ts` has backend tests

**File:** `convex/__tests__/sessions.test.ts` (sole test file, 99 lines)

Tested:
- `createSession` — default/custom title, timestamp
- `setThreadId` — patch + field preservation
- `getSession` — by ID, non-existent

Untested (~400 lines of logic):
- `data.ts` — all 15 mutations/queries (task CRUD, symptom logging, appointment management, seed data)
- `chat.ts` — message flow, greeting generation
- `agent.ts` — all 15 tool handlers
- `dashboard.ts` — today overview query

**Recommendation:** Add at minimum:
- `convex/__tests__/data.test.ts` — task lifecycle, symptom logging, appointment queries
- `convex/__tests__/chat.test.ts` — sendMessage flow

---

## 15. Code Simplifications (50 items)

### App.tsx

**S1.** Combine related refs into a single object ref (lines 25-35)

8 separate `useRef` calls manage one logical state machine. Combine into one:
```ts
// Before: 8 refs
const lastAssistantCountRef = useRef(0);
const hasInitializedRef = useRef(false);
const messageSentMsRef = useRef(0);
const spokenMsgRef = useRef<string | null>(null);
const preparePhaseRef = useRef(false);
const userInteractedRef = useRef(false);
const startListeningRef = useRef<(() => void) | null>(null);
const speechSupportedRef = useRef(false);

// After: 1 ref
const ttsState = useRef({
  lastAssistantCount: 0, initialized: false, messageSentAtMs: 0,
  spokenMsg: null as string | null, preparing: false,
  userInteracted: false,
});
```

**S2.** Extract `handleMicToggle` status branches into a lookup map (lines 248-263)

```ts
// Before: 4 nested if/else
if (status === "idle") { ... }
else if (status === "listening") { ... }
else if (status === "speaking") { ... }
else if (status === "processing") { ... }

// After: table-driven
const toggleAction: Record<AppStatus, () => void> = {
  idle: () => { setStatus("listening"); startListening(); },
  listening: () => { stopListening(); setStatus("idle"); },
  speaking: () => { stopSpeaking(); setStatus("idle"); },
  processing: () => { stopSpeaking(); preparePhaseRef.current = false; setHiddenMsgKey(null); setStatus("idle"); },
};
```

**S3.** Inline `isReady` — used once (line 265)

```ts
// Before
const isReady = !!session?.threadId;
// ... 50 lines later ...
disabled={!isReady}

// After: inline at usage
disabled={!session?.threadId}
```

**S4.** Deduplicate `messages.filter(m => m.role === "assistant")` — appears 3 times (lines 139, 148, 184)

```ts
// Extract once per render
const assistantMsgs = useMemo(
  () => messages.filter((m) => m.role === "assistant"),
  [messages],
);
```

**S5.** Simplify early-hide branching (lines 170-177)

```ts
// Before: if/else setting different values
if (userInteractedRef.current) {
  setHiddenMsgKey(msgKey);
} else {
  spokenMsgRef.current = msgKey;
}

// After: one line per branch, or ternary
userInteractedRef.current ? setHiddenMsgKey(msgKey) : (spokenMsgRef.current = msgKey);
```

**S6.** Remove `handleMetrics` wrapper — it only logs in DEV (lines 54-78)

The callback creates a `PipelineTimings` object only to log two fields from it. Inline the log:
```ts
const handleMetrics = useCallback((m: AudioPipelineMetrics) => {
  if (!import.meta.env.DEV) return;
  const sent = messageSentMsRef.current;
  console.log(
    `[Audio] ttfa=${Math.round(m.firstChunkArrivalMs - sent)}ms` +
    ` total=${Math.round(m.lastChunkEndMs - sent)}ms` +
    ` gaps=${m.gapCount} (${Math.round(m.totalGapSeconds * 1000)}ms)`,
  );
}, []);
```

Eliminates the `PipelineTimings` type (only used here) and the 10-line object construction.

**S7.** Consolidate `handleReset` ref resets into a single object assignment (lines 228-233)

```ts
// Before: 6 separate lines
lastAssistantCountRef.current = 0;
hasInitializedRef.current = false;
spokenMsgRef.current = null;
preparePhaseRef.current = false;
userInteractedRef.current = false;

// After (with S1): 1 line
Object.assign(ttsState.current, { lastAssistantCount: 0, initialized: false, ... });
```

---

### Transcript.tsx

**S8.** Extract `<LoadingDots />` component — identical JSX at lines 80-83 and 172-176

```tsx
function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 150, 300].map((delay) => (
        <span key={delay} className={`h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:${delay}ms]`} />
      ))}
    </div>
  );
}
```

Replaces 12 lines with 1 `<LoadingDots />` at each call site.

**S9.** Combine three `.filter()` chains into one (lines 50-55)

```ts
// Before: 3 passes
const visibleMessages = messages
  .filter((m) => m.role === "user" || m.role === "assistant")
  .filter((m, i) => !(i === 0 && m.role === "user" && m.text.trim() === "Hi!"))
  .filter((m) => m.key !== hiddenMessageKey);

// After: single pass
const visibleMessages = messages.filter((m, i) =>
  (m.role === "user" || m.role === "assistant") &&
  !(i === 0 && m.role === "user" && m.text.trim() === "Hi!") &&
  m.key !== hiddenMessageKey,
);
```

**S10.** Replace manual `lastAssistantIndex` loop with `findLastIndex` (lines 97-103)

```ts
// Before: 7-line for loop
let lastAssistantIndex = -1;
for (let i = displayMessages.length - 1; i >= 0; i--) {
  if (displayMessages[i].role === "assistant") { lastAssistantIndex = i; break; }
}

// After
const lastAssistantIndex = displayMessages.findLastIndex((m) => m.role === "assistant");
```

**S11.** Replace `msgCountRef` + effect with direct comparison (lines 38-44)

The effect just collapses expansion when message count changes. Simplify with `useRef` inline:
```ts
const prevCount = useRef(messages.length);
if (messages.length !== prevCount.current) { prevCount.current = messages.length; setExpanded(false); }
```

This can be done at render time instead of in a `useEffect`.

---

### useTextToSpeech.ts

**S12.** Hoist TTS context config to module constant (lines 96-107)

```ts
// Before: rebuilt every prepare() call
const ttsCtx = wsRef.current!.context({
  model_id: "sonic-3",
  voice: { mode: "id" as const, id: configRef.current!.voiceId },
  output_format: { container: "raw" as const, encoding: "pcm_f32le" as const, sample_rate: SAMPLE_RATE },
});

// After: build once, parameterize voiceId
const TTS_OUTPUT = { container: "raw" as const, encoding: "pcm_f32le" as const, sample_rate: SAMPLE_RATE };
// In prepare():
const ttsCtx = wsRef.current!.context({ model_id: "sonic-3", voice: { mode: "id" as const, id: voiceId }, output_format: TTS_OUTPUT });
```

**S13.** Unify audio byte conversion (lines 114-127)

```ts
// Before: 8-line ternary with ArrayBuffer vs typed array
const bytes = event.audio instanceof ArrayBuffer
  ? new Uint8Array(event.audio) : new Uint8Array(event.audio.buffer, ...);
const float32 = new Float32Array(bytes.buffer.slice(...));

// After: always normalize to ArrayBuffer first
const ab = event.audio instanceof ArrayBuffer ? event.audio : event.audio.buffer;
const float32 = new Float32Array(ab);
```

**S14.** Pull `setIsReady(false)` before the if/else in `play()` (lines 158-174)

Both branches (`fallbackTextRef` and `playerRef`) call `setIsReady(false)`. Hoist it:
```ts
const play = useCallback(() => {
  setIsReady(false);
  if (fallbackTextRef.current) { ... }
  else if (playerRef.current) { playerRef.current.play(); }
}, []);
```

**S15.** Combine `closeWs` into `stop` — it's only called from `stop` (lines 37-46, 48-62)

```ts
// Before: separate closeWs callback + stop callback calling it
const closeWs = useCallback(() => { ... }, []);
const stop = useCallback(() => { ... closeWs(); ... }, [closeWs]);

// After: inline the 5 lines into stop
const stop = useCallback(() => {
  playerRef.current?.stop();
  playerRef.current = null;
  if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
  setIsReady(false);
  fallbackTextRef.current = null;
  window.speechSynthesis?.cancel();
}, []);
```

---

### useSpeechRecognition.ts

**S16.** Merge `onend` and `onerror` handlers — identical logic (lines 41-49)

```ts
// Before
recognition.onend = () => { recognitionRef.current = null; onEnd?.(); };
recognition.onerror = () => { recognitionRef.current = null; onEnd?.(); };

// After
const done = () => { recognitionRef.current = null; onEnd?.(); };
recognition.onend = recognition.onerror = done;
```

**S17.** Use `Object.assign` for recognition config (lines 30-32)

```ts
// Before
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = false;

// After
Object.assign(recognition, { lang: "en-US", interimResults: false, continuous: false });
```

---

### VoiceButton.tsx

**S18.** Replace nested ternaries with a config map (lines 17-31)

```ts
// Before: 6-line nested ternary for className + inline ternary for icon
const btnStyles = isActive ? "bg-coral..." : isSpeaking ? "bg-teal..." : "bg-gray-100...";

// After
const config: Record<string, { bg: string; icon: typeof MicIcon }> = {
  listening: { bg: "bg-coral text-white shadow-lg shadow-coral/30", icon: MicIcon },
  speaking: { bg: "bg-teal text-white", icon: SpeakerIcon },
  default: { bg: "bg-gray-100 text-purple hover:bg-gray-200", icon: MicIcon },
};
const { bg, icon: Icon } = config[status] ?? config.default;
```

---

### StatusPanel.tsx

**S19.** Create `Date` object once instead of twice (lines 121, 127)

```ts
// Before
{new Date(nextAppointment.dateTime).toLocaleDateString(...)}
{new Date(nextAppointment.dateTime).toLocaleTimeString(...)}

// After
const apptDate = new Date(nextAppointment.dateTime);
{apptDate.toLocaleDateString(...)} at {apptDate.toLocaleTimeString(...)}
```

**S20.** Extract task status icon into a lookup (lines 74-86)

Three branches of nearly identical SVG. Replace with:
```tsx
const statusIcon: Record<string, JSX.Element> = {
  done: <svg className="mt-0.5 h-5 w-5 shrink-0 text-teal" ...>...</svg>,
  skipped: <svg className="mt-0.5 h-5 w-5 shrink-0 text-gray-300" ...>...</svg>,
  pending: <svg className="mt-0.5 h-5 w-5 shrink-0 text-coral" ...>...</svg>,
};
// Usage: {statusIcon[task.status]}
```

---

### convex/agent.ts

**S21.** Remove `AnyTool` type alias — used only to silence TypeScript (line 28)

```ts
// Before
type AnyTool = any;
const getTodaysTasks: AnyTool = createTool({ ... });

// After: let TypeScript infer from createTool()
const getTodaysTasks = createTool({ ... });
```

If inference works, this removes the eslint-disable comment and the type alias.

**S22.** Extract `resolveSessionId` + handler boilerplate into a `createSessionTool` wrapper

All 15 tools repeat: `const sessionId = await resolveSessionId(ctx);`

```ts
// Before (repeated 15 times)
const getTodaysTasks = createTool({
  args: z.object({}),
  handler: async (ctx: Ctx) => {
    const sessionId = await resolveSessionId(ctx);
    return await ctx.runQuery(...);
  },
});

// After
function sessionTool<A extends z.ZodType>(opts: {
  description: string; args: A;
  handler: (ctx: Ctx, sessionId: string, args: z.infer<A>) => Promise<unknown>;
}) {
  return createTool({
    description: opts.description,
    args: opts.args,
    handler: async (ctx: Ctx, args: z.infer<A>) => {
      const sessionId = await resolveSessionId(ctx);
      return opts.handler(ctx, sessionId, args);
    },
  });
}

const getTodaysTasks = sessionTool({
  description: "Get today's treatment tasks",
  args: z.object({}),
  handler: async (ctx, sessionId) =>
    ctx.runQuery(internal.data.getTasksForDate, { sessionId, date: todayISO() }),
});
```

Saves ~3-5 lines per tool × 15 tools = ~60 lines.

**S23.** Simplify `getLanguageModel` — switch is overkill for 2 cases (lines 404-414)

```ts
// Before: 11-line switch
function getLanguageModel(): LanguageModel {
  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  const model = process.env.LLM_MODEL;
  switch (provider) {
    case "cerebras": return cerebras(model ?? "gpt-oss-120b");
    case "anthropic": default: return anthropic(model ?? "claude-haiku-4-5-20251001");
  }
}

// After (once cerebras dead code is removed per S1.3): 1 line
const getLanguageModel = () => anthropic(process.env.LLM_MODEL ?? "claude-haiku-4-5-20251001");
```

**S24.** Inline explicit handler arg types — redundant with Zod schema (throughout)

```ts
// Before: explicit type duplicating Zod schema
handler: async (ctx: Ctx, args: { titleFragment: string; date?: string }) => { ... }

// After: inferred from schema
handler: async (ctx: Ctx, args) => { ... }
```

Zod already defines the shape; TypeScript infers it. Removes ~15 inline type annotations.

---

### convex/data.ts

**S25.** Use `.first()` instead of `.collect()[0]` for single-record queries (lines 40-44)

```ts
// Before
const profiles = await ctx.db.query("patientProfiles")
  .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
  .collect();
return profiles[0] ?? null;

// After
return await ctx.db.query("patientProfiles")
  .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
  .first();
```

Applies to `getProfile` (data.ts:40-44) and `dashboard.ts:12-16`.

**S26.** Chain filter directly in `getActiveMedications` (lines 61-65)

```ts
// Before
const meds = await ctx.db.query(...).collect();
return meds.filter((m) => cycleDay >= m.startDay && cycleDay <= m.endDay);

// After
return (await ctx.db.query(...).collect())
  .filter((m) => cycleDay >= m.startDay && cycleDay <= m.endDay);
```

**S27.** Simplify `getTaskByTitle` — deduplicate query branches (lines 130-144)

```ts
// Before: ternary producing two nearly-identical query chains
const tasks = date
  ? await ctx.db.query("treatmentTasks").withIndex("by_session_date", ...).collect()
  : await ctx.db.query("treatmentTasks").withIndex("by_session", ...).collect();

// After: always query by session, optionally filter
let query = ctx.db.query("treatmentTasks").withIndex("by_session", (q) => q.eq("sessionId", sessionId));
const tasks = await query.collect();
const filtered = date ? tasks.filter((t) => t.scheduledDate === date) : tasks;
return filtered.find((t) => t.title.toLowerCase().includes(fragment)) ?? null;
```

**S28.** Data-drive medication seed inserts (lines 246-295)

4 separate `ctx.db.insert("medications", {...})` calls with identical structure:
```ts
// Before: 50 lines of 4 insert calls
await ctx.db.insert("medications", { sessionId: sid, name: "Letrozole", ... });
await ctx.db.insert("medications", { sessionId: sid, name: "Prenatal Vitamin", ... });
// ... 2 more

// After: array of configs + loop
const meds = [
  { name: "Letrozole", dosage: "5mg", ... },
  { name: "Prenatal Vitamin", dosage: "1 tablet", ... },
  // ...
];
await Promise.all(meds.map((m) => ctx.db.insert("medications", { sessionId: sid, ...m })));
```

**S29.** Simplify `addPrepQuestion` — use optional chaining (lines 211-218)

```ts
// Before: 4 lines
const appointment = await ctx.db.get(appointmentId);
if (!appointment) return;
const existing = appointment.prepQuestions ?? [];
await ctx.db.patch(appointmentId, { prepQuestions: [...existing, question] });

// After: 3 lines
const appt = await ctx.db.get(appointmentId);
if (!appt) return;
await ctx.db.patch(appointmentId, { prepQuestions: [...(appt.prepQuestions ?? []), question] });
```

---

### convex/chat.ts

**S30.** Consolidate `generateResponse` and `generateGreeting` — near-identical (lines 28-60)

```ts
// Before: two separate 15-line handlers
export const generateResponse = internalAction({ handler: async (ctx, { threadId, promptMessageId }) => {
  const agent = createVoiceAgent();
  const result = await agent.streamText(ctx, { threadId }, { promptMessageId }, { saveStreamDeltas: true });
  await result.text;
}});

export const generateGreeting = internalAction({ handler: async (ctx, { threadId }) => {
  const { messageId } = await saveMessage(ctx, components.agent, { threadId, prompt: "Hi!" });
  const agent = createVoiceAgent();
  const result = await agent.streamText(ctx, { threadId }, { promptMessageId: messageId }, { saveStreamDeltas: true });
  await result.text;
}});

// After: extract shared logic
async function runAgent(ctx: any, threadId: string, promptMessageId: string) {
  const result = await createVoiceAgent().streamText(
    ctx, { threadId }, { promptMessageId }, { saveStreamDeltas: true },
  );
  await result.text;
}
```

---

### convex/dashboard.ts

**S31.** Use `.first()` for profile query (lines 12-16) — same as S25

**S32.** Reuse `getUpcomingAppointments` from data.ts instead of reimplementing (lines 27-33)

```ts
// Before: duplicated filter+sort from data.ts:188-190
const appointments = await ctx.db.query("appointments")...collect();
const upcoming = appointments.filter(...).sort(...);

// After: call data.ts query
const upcoming = await ctx.runQuery(internal.data.getUpcomingAppointments, { sessionId: sid });
const nextAppointment = upcoming[0] ?? null;
```

---

### Tests

**S33.** Remove all `afterEach(cleanup)` — RTL auto-cleans (4 files)

Delete from: `Header.test.tsx:4`, `TextInput.test.tsx:4`, `VoiceButton.test.tsx:4`, `Transcript.test.tsx:9`.

**S34.** Use `test.each` for VoiceButton status/style tests (VoiceButton.test.tsx)

```ts
// Before: 3 separate tests for idle→gray, listening→coral, speaking→teal
test("idle → gray background", () => { ... });
test("listening → red background", () => { ... });
test("speaking → green background", () => { ... });

// After
test.each([
  ["idle", "Start listening", "bg-gray-100"],
  ["listening", "Stop listening", "bg-coral"],
  ["speaking", "Stop speaking", "bg-teal"],
] as const)("%s → %s button with %s", (status, label, cssClass) => {
  render(<VoiceButton status={status} onClick={vi.fn()} disabled={false} />);
  expect(screen.getByRole("button", { name: label }).className).toContain(cssClass);
});
```

Replaces 3 tests (18 lines) with 1 parameterized test (8 lines).

**S35.** Use `test.each` for VoiceButton aria-label tests (VoiceButton.test.tsx)

Same pattern: lines 8-13, 40-47, 77-84 test the same thing for 3 statuses.

**S36.** Extract shared `renderVoiceButton` helper (VoiceButton.test.tsx)

```ts
// Before: repeated in every test
render(<VoiceButton status="idle" onClick={vi.fn()} disabled={false} />);

// After
const renderBtn = (status: AppStatus, opts?: Partial<VoiceButtonProps>) =>
  render(<VoiceButton status={status} onClick={opts?.onClick ?? vi.fn()} disabled={opts?.disabled ?? false} />);
```

**S37.** Consolidate `installAudioMocks`/`installSpeechMocks`/`removeMocks` (useTextToSpeech.test.ts:91-151)

Three setup functions totaling 60 lines. Combine:
```ts
function installMocks() { installAudioMocks(); installSpeechMocks(); }
// beforeEach: installMocks()
// afterEach: removeMocks()
```

Or better: extract all mocks into `src/__tests__/helpers/browserMocks.ts`.

**S38.** Replace `removeMocks` loop of `delete`s with a helper (useTextToSpeech.test.ts:143-151)

```ts
// Before: 3 separate delete statements with eslint-disable
delete (window as any).speechSynthesis;
delete (window as any).SpeechSynthesisUtterance;
delete (globalThis as any).AudioContext;

// After
for (const key of ["speechSynthesis", "SpeechSynthesisUtterance"]) delete (window as any)[key];
delete (globalThis as any).AudioContext;
```

**S39.** Share `MockAudioBufferSourceNode` between test files (useTextToSpeech.test.ts:64-70 and StreamingAudioPlayer.test.ts:9-15)

Both files define nearly identical mock classes. Extract to shared file.

**S40.** Use `Header.test.tsx:29-37` `test.each` instead of manual loop

```ts
// Before: manual for+render+unmount loop
const statuses: AppStatus[] = ["idle", "listening", "processing", "speaking"];
for (const status of statuses) {
  const { container, unmount } = render(<Header status={status} />);
  ...
  unmount();
}

// After: test.each handles isolation
test.each(["idle", "listening", "processing", "speaking"] as const)(
  "renders mascot for %s", (status) => {
    const { container } = render(<Header status={status} />);
    expect(container.querySelector("img[aria-hidden='true']")).not.toBeNull();
  },
);
```

---

### E2E Tests

**S41.** Extract shared `beforeEach` setup into a test fixture (all 7 E2E files)

Every file repeats:
```ts
await page.goto("/");
await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({ timeout: 15000 });
```

Use a Playwright fixture:
```ts
// e2e/fixtures.ts
export const test = base.extend({ readyPage: async ({ page }, use) => {
  await page.goto("/");
  await page.getByLabel("Tap to start conversation").click();
  await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({ timeout: 15000 });
  await use(page);
}});
```

**S42.** Replace CSS class locators with semantic selectors (text-chat.spec.ts, session.spec.ts)

```ts
// Before
page.locator(".bg-purple.text-white").filter({ hasText: "Hello" })

// After (with data-testid added to components)
page.getByTestId("user-message").filter({ hasText: "Hello" })
```

**S43.** Remove redundant `toBeVisible` timeout in dashboard tests (dashboard.spec.ts)

```ts
// Before: 4 tests each with { timeout: 10000 }
await expect(page.getByText("Today's Tasks")).toBeVisible({ timeout: 10000 });
await expect(page.getByText(/\d+\/\d+ completed/)).toBeVisible({ timeout: 10000 });

// After: set default timeout in config
// playwright.config.ts: expect: { timeout: 10000 }
```

---

### Configuration

**S44.** Simplify `vite.config.ts` conditional entry point (lines 17-24)

```ts
// Before: spread + ternary + mode check
rollupOptions: {
  input: {
    main: path.resolve(__dirname, "index.html"),
    ...(mode !== "production" ? { "ui-kit": path.resolve(__dirname, "ui-kit.html") } : {}),
  },
},

// After: just always include it, or remove if unused in prod
rollupOptions: {
  input: path.resolve(__dirname, "index.html"),
},
```

The `ui-kit` entry is excluded from production anyway — Vite tree-shakes unused entry points.

**S45.** Remove `husky` pre-commit full-CI run — replace with lint-staged (.husky/pre-commit)

```bash
# Before: runs everything on every commit (~30s)
npm run typecheck && npm run lint && npm run test:run

# After: only lint changed files (~3s)
npx lint-staged
```

**S46.** Combine `tsconfig.json` references — reduce to 2 configs

Currently 3 tsconfig files (`tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`) plus `convex/tsconfig.json`. The root `tsconfig.json` just references the other two. This is standard Vite scaffolding but could be simplified to just `tsconfig.json` + `convex/tsconfig.json` if the node config is trivial.

---

### Lib Files

**S47.** Simplify `extractCompleteSentences` — return type is over-specified (extractCompleteSentences.ts)

```ts
// Before: explicit return type annotation
export function extractCompleteSentences(text: string): {
  sentences: string[];
  remainder: string;
} {

// After: let TypeScript infer it
export function extractCompleteSentences(text: string) {
```

**S48.** Simplify `StreamingAudioPlayer.stop()` — inline source cleanup (StreamingAudioPlayer.ts:197-209)

```ts
// Before
for (const source of this.activeSources) {
  try { source.stop(); } catch { }
}
this.activeSources = [];

// After
this.activeSources.forEach((s) => { try { s.stop(); } catch {} });
this.activeSources = [];
```

**S49.** Simplify `audioTelemetry.ts` — `PipelineTimings` type is only used in one DEV-only log (audioTelemetry.ts:21-28)

If S6 is applied (inlining the log), `PipelineTimings` becomes dead code. Delete the interface entirely.

---

### Mascot.tsx

**S50.** Remove contradictory `role="img"` (Mascot.tsx:44) — simplifies accessibility

```tsx
// Before
<img src={src} alt="" role="img" aria-hidden="true" className={...} />

// After
<img src={src} alt="" aria-hidden="true" className={...} />
```

One attribute deleted, accessibility semantics fixed.

---

## 16. Additional Simplifications (S51–S100)

### App.tsx

**S51.** Extract `getTzOffset()` helper — `new Date().getTimezoneOffset()` called identically twice (lines 130, 247)

```ts
// Before — duplicated at mount and reset
createSession({ tzOffset: new Date().getTimezoneOffset() }) // line 130
const id = await createSession({ tzOffset: new Date().getTimezoneOffset() }); // line 247

// After
const getTzOffset = () => new Date().getTimezoneOffset();
// Both sites: createSession({ tzOffset: getTzOffset() })
```

**S52.** Use `.at(-1)` instead of `array[array.length - 1]` — appears 3 times (lines 143, 168, 203)

```ts
// Before
const latest = assistantMsgs[assistantMsgs.length - 1];

// After
const latest = assistantMsgs.at(-1);
```

Applies to `handleStart` (line 143), early-hide effect (line 168), and TTS effect (line 203).

**S53.** Simplify TTS target search with `findLast()` (lines 192–199)

```ts
// Before: 8-line manual reverse loop
let target: (typeof assistantMsgs)[number] | undefined;
for (let i = assistantMsgs.length - 1; i >= 0; i--) {
  const m = assistantMsgs[i];
  if (m.status === "streaming" || m.status === "pending") continue;
  if (!m.text.replace(/[^\p{L}\p{N}]/gu, "").trim()) continue;
  target = m;
  break;
}

// After: 3 lines
const target = assistantMsgs.findLast(
  (m) => m.status !== "streaming" && m.status !== "pending" &&
    m.text.replace(/[^\p{L}\p{N}]/gu, "").trim(),
);
```

**S54.** Remove unused `isReady` state from `useTextToSpeech` (useTextToSpeech.ts:30, 148, 152, 162, 171)

The hook returns `{ prepare, play, stop, isReady }` but App.tsx (line 89) destructures only `{ prepare, play, stop }`. The `isReady` state, its setter calls (5 sites), and the `useState` import can be removed.

**S55.** Simplify `resetRequested` watcher — 5-line effect for a one-liner (lines 253–257)

```ts
// Before
useEffect(() => {
  if (session?.resetRequested) {
    handleReset();
  }
}, [session?.resetRequested, handleReset]);

// After: merge into existing session-dependent logic or use direct conditional call
useEffect(() => {
  if (session?.resetRequested) handleReset();
}, [session?.resetRequested, handleReset]);
```

Minimal savings here, but the effect could be collapsed into a single-line expression.

---

### Transcript.tsx

**S56.** Move `cleanDisplayText` + `stripInlineJson` to `src/lib/textUtils.ts` (lines 14–46)

33 lines of pure text processing live inside a component file. These are testable utility functions with no React dependencies. Extract to `src/lib/textUtils.ts` and import.

**S57.** Use a named constant for the `"Hi!"` magic string (line 81)

```ts
// Before
.filter((m, i) => !(i === 0 && m.role === "user" && m.text.trim() === "Hi!"))

// After
const HIDDEN_GREETING = "Hi!";
.filter((m, i) => !(i === 0 && m.role === "user" && m.text.trim() === HIDDEN_GREETING))
```

Makes the intent clearer and avoids a magic string.

**S58.** Replace role-based `className` ternary with lookup (line 173)

```ts
// Before
className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}

// After
const alignClass = { user: "justify-end", assistant: "justify-start" } as const;
className={`flex ${alignClass[message.role as keyof typeof alignClass] ?? "justify-start"}`}
```

**S59.** Inline `handleExpand` — only used once as onClick handler (lines 133–139, 147)

```ts
// Before: named function used once
const handleExpand = () => {
  setExpanded(true);
  requestAnimationFrame(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  });
};
// ... onClick={handleExpand}

// After: inline at call site
onClick={() => {
  setExpanded(true);
  requestAnimationFrame(() =>
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" }),
  );
}}
```

---

### Mascot.tsx

**S60.** Combine `statusSvg` and `statusAnimation` into a single Record (lines 8–20)

```ts
// Before: 2 separate Record objects with identical keys
const statusSvg: Record<AppStatus, string> = { idle: emberIdle, ... };
const statusAnimation: Record<AppStatus, string> = { idle: "animate-breathe", ... };

// After: 1 combined Record
const statusConfig: Record<AppStatus, { svg: string; animation: string }> = {
  idle: { svg: emberIdle, animation: "animate-breathe" },
  listening: { svg: emberListening, animation: "animate-attentive" },
  processing: { svg: emberProcessing, animation: "animate-think" },
  speaking: { svg: emberSpeaking, animation: "animate-speak" },
};
const { svg: src, animation } = size === "sm"
  ? { svg: emberMini, animation: statusConfig[status].animation }
  : statusConfig[status];
```

**S61.** Remove `as const` from `sizeClasses` (line 26)

```ts
// Before
const sizeClasses = { sm: "h-6 w-6", md: "h-10 w-10", lg: "h-[120px] w-[120px]" } as const;

// After — values are strings either way; size param constrains the key type
const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "h-6 w-6", md: "h-10 w-10", lg: "h-[120px] w-[120px]",
};
```

---

### VoiceButton.tsx

**S62.** Remove `isActive`/`isSpeaking` intermediary booleans (lines 10–11)

```ts
// Before: 2 booleans used 2-3 times each
const isActive = status === "listening";
const isSpeaking = status === "speaking";
// ... isActive ? "bg-coral..." : isSpeaking ? "bg-teal..." : ...

// After: use status directly (pairs well with S18 config map)
status === "listening" ? "bg-coral..." : status === "speaking" ? "bg-teal..." : ...
```

If S18 (config map) is applied, these booleans become completely unnecessary.

---

### StatusPanel.tsx

**S63.** Single-pass task grouping instead of double filter (lines 25–26, 72)

```ts
// Before: 2 filter passes
const doneTasks = todayTasks.filter((t) => t.status === "done");
const pendingTasks = todayTasks.filter((t) => t.status === "pending");
// [...pendingTasks, ...doneTasks].map(...)

// After: single sort
const sortedTasks = [...todayTasks].sort((a, b) =>
  (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0),
);
// sortedTasks.map(...)
```

Also eliminates the spread `[...pendingTasks, ...doneTasks]`.

**S64.** Destructure `data` prop inline to avoid separate line (line 24)

```ts
// Before
const { profile, todayTasks, nextAppointment } = data;

// After: destructure in function parameter with default
// Already clean — minimal savings. Consider skipping.
```

Actually, the current form is fine. The real simplification: remove the `TodayOverview` interface (lines 3–7) since it's used only here, and inline the type in the prop declaration.

```ts
// Before: standalone interface + prop type
interface TodayOverview { ... }
export function StatusPanel({ data }: { data: TodayOverview | undefined; ... })

// After: inline — removes 5-line interface
export function StatusPanel({ data }: {
  data: { profile: Doc<"patientProfiles"> | null; todayTasks: Doc<"treatmentTasks">[]; nextAppointment: Doc<"appointments"> | null } | undefined;
  onClose?: () => void;
})
```

---

### useSpeechRecognition.ts

**S65.** Simplify `isSupported` check with nullish coalescing (lines 20–22)

```ts
// Before: 2-line typeof + in check
const isSupported =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

// After: 1 line
const isSupported = typeof window !== "undefined" &&
  !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
```

**S66.** Remove `SpeechRecognitionReturn` interface — used only once as return type (lines 8–12)

```ts
// Before: 5-line interface
interface SpeechRecognitionReturn {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}
export function useSpeechRecognition(...): SpeechRecognitionReturn { ... }

// After: let TypeScript infer from the return statement
export function useSpeechRecognition(...) {
  // ... return { start, stop, isSupported };
}
```

---

### StreamingAudioPlayer.ts

**S67.** Extract `source.onended` handler to private method — identical at lines 96–102 and 152–158

```ts
// Before: identical handler copy-pasted in appendChunk() and play()
source.onended = () => {
  this.activeSources = this.activeSources.filter((s) => s !== source);
  if (this.streamComplete && this.activeSources.length === 0) {
    this.lastChunkEndMs = this.clock.now();
    this.onEnd?.();
  }
};

// After: extract once
private bindSourceEnd(source: AudioBufferSourceNode) {
  source.onended = () => {
    this.activeSources = this.activeSources.filter((s) => s !== source);
    if (this.streamComplete && this.activeSources.length === 0) {
      this.lastChunkEndMs = this.clock.now();
      this.onEnd?.();
    }
  };
}
// Both sites: this.bindSourceEnd(source);
```

**S68.** Remove `bufferingDone` field — derive from existing state (lines 25, 107, 165–167)

```ts
// Before: separate boolean tracked manually
private bufferingDone = false;
// In markStreamComplete(): this.bufferingDone = true;
isBufferingDone(): boolean { return this.bufferingDone; }

// After: derive from state
isBufferingDone(): boolean { return this.buffered && this.streamComplete; }
```

Wait — `streamComplete` is only set in the non-buffered path (line 112) and in `play()` (line 162). The buffered `markStreamComplete` doesn't set it. But we can use `bufferingDone` only once we set `streamComplete` for both paths. Simpler alternative:

```ts
// Merge into markStreamComplete:
markStreamComplete() {
  this.streamComplete = true; // always set
  if (this.buffered) {
    this.onBufferingComplete?.();
    return;
  }
  if (this.activeSources.length === 0) { ... }
}
// Then isBufferingDone = this.buffered && this.streamComplete
```

Eliminates one field.

**S69.** Combine two `.reduce()` calls in `getMetrics()` into a single pass (lines 174–181)

```ts
// Before: 2 separate reduces + filter + map
const totalAudioDurationSeconds = this.chunkEvents.reduce((sum, e) => sum + e.bufferDurationSeconds, 0);
const totalGapSeconds = this.chunkEvents.reduce((sum, e) => sum + e.gapSeconds, 0);
const gapCount = this.chunkEvents.filter((e) => e.gapSeconds > 0).length;
const maxGapSeconds = Math.max(...this.chunkEvents.map((e) => e.gapSeconds));

// After: single pass
let totalAudioDurationSeconds = 0, totalGapSeconds = 0, gapCount = 0, maxGapSeconds = 0;
for (const e of this.chunkEvents) {
  totalAudioDurationSeconds += e.bufferDurationSeconds;
  totalGapSeconds += e.gapSeconds;
  if (e.gapSeconds > 0) gapCount++;
  if (e.gapSeconds > maxGapSeconds) maxGapSeconds = e.gapSeconds;
}
```

4 iterations → 1. Also avoids `Math.max(...arr)` which can stack overflow on large arrays.

---

### convex/agent.ts

**S70.** Remove `import type { LanguageModel } from "ai"` (line 6)

Only used as the return type annotation on `getLanguageModel(): LanguageModel` (line 404). TypeScript can infer the return type from `anthropic(...)`.

```ts
// Before
import type { LanguageModel } from "ai";
function getLanguageModel(): LanguageModel { ... }

// After
function getLanguageModel() { ... } // return type inferred
```

**S71.** Remove `console.log` from `getLanguageModel` (line 407)

```ts
console.log(`[LLM] provider=${provider} model=${model ?? "(default)"}`);
```

This runs on every agent invocation (every message + greeting). In production, this creates noise in Convex logs. Remove or gate behind a `DEBUG` env flag.

**S72.** Standardize tool variable naming — inconsistent `Tool` suffix (lines 30–373)

Some tools use a `Tool` suffix (`completeTaskTool`, `createTaskTool`, `skipTaskTool`, `getMedicationsTool`, `logSymptomsTool`, etc.) while others don't (`getTodaysTasks`, `getTasksForDate`). The tools object at line 422–437 also maps some to different names:

```ts
tools: {
  getTodaysTasks,           // no suffix, key matches
  completeTask: completeTaskTool,  // suffix, key remapped
  getProfile: getProfileTool,      // suffix, key remapped
}
```

**Recommendation:** Drop all `Tool` suffixes to match the property keys in the tools object.

**S73.** Remove redundant `as Id<"sessions">` cast (line 369)

```ts
// Before
const sessionId = await resolveSessionId(ctx) as Id<"sessions">;
await ctx.runMutation(internal.sessions.requestReset, { sessionId });

// After — requestReset accepts v.id("sessions"), and resolveSessionId returns session._id
// which IS an Id<"sessions">. The cast is redundant.
const sessionId = await resolveSessionId(ctx);
```

Wait — `resolveSessionId` returns `string` (line 12: `Promise<string>`), so the cast is actually needed. But the real fix is to make `resolveSessionId` return `Id<"sessions">` instead of `string`.

**S74.** Early return in `getMedicationsTool` to reduce nesting (lines 161–174)

```ts
// Before
if (args.activeOnly) {
  const profile = await ctx.runQuery(...);
  if (!profile) return [];
  return await ctx.runQuery(...);
}
return await ctx.runQuery(...);

// After: flip the condition
if (!args.activeOnly) {
  return await ctx.runQuery(internal.data.getMedications, { sessionId });
}
const profile = await ctx.runQuery(internal.data.getProfile, { sessionId });
return profile
  ? await ctx.runQuery(internal.data.getActiveMedications, { sessionId, cycleDay: profile.cycleDay })
  : [];
```

**S75.** Simplify `logSymptomsTool` return — echoes input unnecessarily (lines 203–208)

```ts
// Before: return object repeats args back
return {
  success: true,
  date: today,
  cycleDay: profile?.cycleDay,
  symptoms: args.symptoms,
};

// After: the LLM already knows what it sent
return { success: true, date: today, cycleDay: profile?.cycleDay ?? 0 };
```

**S76.** Flatten appointment lookup in `generateAppointmentSummaryTool` (lines 291–303)

```ts
// Before: 13-line if/else
let appointment;
if (args.appointmentTitleFragment) {
  appointment = await ctx.runQuery(internal.data.getAppointmentByTitle, { ... });
} else {
  const upcoming = await ctx.runQuery(internal.data.getUpcomingAppointments, { sessionId });
  appointment = upcoming[0] ?? null;
}

// After: ternary
const appointment = args.appointmentTitleFragment
  ? await ctx.runQuery(internal.data.getAppointmentByTitle, {
      sessionId, titleFragment: args.appointmentTitleFragment,
    })
  : (await ctx.runQuery(internal.data.getUpcomingAppointments, { sessionId }))[0] ?? null;
```

---

### convex/chat.ts

**S77.** Extract default voice ID to named constant (lines 88–90, 116–118)

```ts
// Before: magic UUID repeated
id: process.env.CARTESIA_VOICE_ID ?? "156fb8d2-335b-4950-9cb3-a2d33befec77"
// ... appears in both synthesizeSpeech and getTtsConfig

// After
const DEFAULT_VOICE_ID = "156fb8d2-335b-4950-9cb3-a2d33befec77";
// Both sites: process.env.CARTESIA_VOICE_ID ?? DEFAULT_VOICE_ID
```

**S78.** Remove `args: {}` from `getTtsConfig` (line 110)

```ts
// Before
export const getTtsConfig = action({
  args: {},
  handler: async () => { ... },
});

// After — Convex treats missing args as empty
export const getTtsConfig = action({
  handler: async () => { ... },
});
```

---

### convex/dashboard.ts

**S79.** Inline `today` variable — used once (line 7)

```ts
// Before
const today = new Date().toISOString().split("T")[0];
// ... 12 lines later ...
q.eq("sessionId", sid).eq("scheduledDate", today)

// After — inline at usage
q.eq("sessionId", sid).eq("scheduledDate", new Date().toISOString().split("T")[0])
```

---

### convex/data.ts

**S80.** Use `.take(limit)` instead of `.collect()` + `.slice(0, limit)` in `getLatestSymptoms` (lines 168–175)

```ts
// Before
const logs = await ctx.db.query("symptomLogs")
  .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
  .order("desc")
  .collect();
return logs.slice(0, limit);

// After — let the database limit the result set
return await ctx.db.query("symptomLogs")
  .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
  .order("desc")
  .take(limit);
```

**S81.** Data-drive today's standalone task inserts into array (lines 313–343)

```ts
// Before: 3 separate ctx.db.insert calls for today's tasks (30 lines)
await ctx.db.insert("treatmentTasks", { sessionId: sid, title: "Take prenatal vitamin", ... });
await ctx.db.insert("treatmentTasks", { sessionId: sid, title: "Log symptoms and mood", ... });
await ctx.db.insert("treatmentTasks", { sessionId: sid, title: "Monitoring ultrasound appointment", ... });

// After: array + loop
const todayTasks = [
  { title: "Take prenatal vitamin", description: "...", scheduledTime: "08:00", category: "medication" },
  { title: "Log symptoms and mood", description: "...", category: "logging" },
  { title: "Monitoring ultrasound appointment", description: "...", scheduledTime: "10:00", category: "appointment" },
];
for (const task of todayTasks) {
  await ctx.db.insert("treatmentTasks", { sessionId: sid, scheduledDate: today, status: "pending", ...task });
}
```

**S82.** Data-drive appointment seed inserts into array (lines 394–435)

```ts
// Before: 3 separate appointment inserts (41 lines)
await ctx.db.insert("appointments", { sessionId: sid, title: "Monitoring ultrasound", ... });
await ctx.db.insert("appointments", { sessionId: sid, title: "Final monitoring...", ... });
await ctx.db.insert("appointments", { sessionId: sid, title: "IUI procedure", ... });

// After: array + loop
const appointments = [
  { title: "Monitoring ultrasound", daysOffset: 0, hour: 10, ... },
  { title: "Final monitoring and trigger shot timing", daysOffset: 4, hour: 9, ... },
  { title: "IUI procedure", daysOffset: 6, hour: 9, ... },
];
for (const appt of appointments) {
  await ctx.db.insert("appointments", {
    sessionId: sid, title: appt.title,
    dateTime: localTime(appt.daysOffset, appt.hour, 0, tzOffset), ...
  });
}
```

**S83.** Data-drive symptom log seed inserts into array (lines 437–465)

```ts
// Before: 3 separate symptom log inserts (28 lines)
await ctx.db.insert("symptomLogs", { sessionId: sid, date: formatDate(daysFromNow(-3)), ... });
await ctx.db.insert("symptomLogs", { sessionId: sid, date: formatDate(daysFromNow(-2)), ... });
await ctx.db.insert("symptomLogs", { sessionId: sid, date: formatDate(daysFromNow(-1)), ... });

// After
const symptomLogs = [
  { daysOffset: -3, cycleDay: 5, symptoms: ["hot flashes", "headache"], mood: "anxious", notes: "..." },
  { daysOffset: -2, cycleDay: 6, symptoms: ["fatigue", "bloating"], mood: "tired but hopeful" },
  { daysOffset: -1, cycleDay: 7, symptoms: ["bloating", "mood swings"], mood: "emotional", notes: "..." },
];
for (const log of symptomLogs) {
  const d = daysFromNow(log.daysOffset);
  await ctx.db.insert("symptomLogs", {
    sessionId: sid, date: formatDate(d), loggedAt: d.getTime(), ...log,
  });
}
```

---

### Unit Tests

**S84.** Extract `msg()` helper into shared test utils (Transcript.test.tsx:11–17)

```ts
// Current: defined in Transcript.test.tsx
function msg(role: "user" | "assistant" | "system" | "tool", text: string, key?: string) {
  return { key: key ?? text, role, text };
}

// Move to: src/__tests__/helpers/testMessages.ts
// Then import in any test that needs mock messages
```

**S85.** Extract shared `renderTextInput` helper (TextInput.test.tsx)

`render(<TextInput onSend={vi.fn()} disabled={false} />)` is repeated in 9 of 10 tests with identical props:

```ts
// After: helper at top of describe
const renderInput = (overrides: Partial<TextInputProps> = {}) =>
  render(<TextInput onSend={overrides.onSend ?? vi.fn()} disabled={overrides.disabled ?? false} />);
```

**S86.** Combine `createMockConstructor` + `installMock` into single function (useSpeechRecognition.test.ts:18–42)

```ts
// Before: 2 separate functions (25 lines)
function createMockConstructor() { ... }
function installMock(key: "SpeechRecognition" | "webkitSpeechRecognition") {
  lastInstance = null;
  Object.defineProperty(window, key, { value: createMockConstructor(), ... });
}

// After: single function
function installSpeechMock(key: "SpeechRecognition" | "webkitSpeechRecognition") {
  lastInstance = null;
  Object.defineProperty(window, key, {
    value: function MockSpeechRecognition() {
      const instance: MockInstance = { lang: "", interimResults: false, ... };
      lastInstance = instance;
      return instance;
    },
    writable: true,
    configurable: true,
  });
}
```

**S87.** Use `test.each` for Transcript alignment tests (Transcript.test.tsx:86–98)

```ts
// Before: 2 separate tests
test("user messages right-aligned", () => { ... });
test("assistant messages left-aligned", () => { ... });

// After
test.each([
  ["user", "Hello", "justify-end"],
  ["assistant", "Hi!", "justify-start"],
] as const)("%s messages → %s alignment", (role, text, cssClass) => {
  render(<Transcript messages={[msg(role, text)]} status="idle" started />);
  const el = screen.getByText(text);
  expect(el.closest(`.flex.${cssClass}`)).not.toBeNull();
});
```

**S88.** Use `test.each` for Transcript bubble color tests (Transcript.test.tsx:100–112)

```ts
// Before: 2 separate tests
test("user bubble is blue", () => { ... });
test("assistant bubble is white", () => { ... });

// After
test.each([
  ["user", "Hello", ".bg-purple"],
  ["assistant", "Hi!", ".bg-white"],
] as const)("%s bubble → %s", (role, text, selector) => {
  render(<Transcript messages={[msg(role, text)]} status="idle" started />);
  expect(screen.getByText(text).closest(selector)).not.toBeNull();
});
```

**S89.** Combine VoiceButton processing disabled tests (VoiceButton.test.tsx:57–75)

```ts
// Before: 2 separate tests for disabled + onClick not fired
test("processing → button is disabled", () => { ... });
test("processing → onClick not fired", () => { ... });

// After: single test
test("processing → button disabled and click has no effect", () => {
  const onClick = vi.fn();
  render(<VoiceButton status="processing" onClick={onClick} disabled={false} />);
  const button = screen.getByRole("button", { name: "Start listening" }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  fireEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
});
```

---

### E2E Tests

**S90.** Extract `test.skip(browserName !== "chromium")` to a Playwright fixture (voice-button.spec.ts)

Repeated 3 times (lines 9–12, 24–27, 42–45) with identical message:

```ts
// Before (3 tests)
test.skip(browserName !== "chromium", "Web Speech API only available in Chromium");

// After: custom fixture
import { test as base } from "@playwright/test";
const test = base.extend({
  chromiumOnly: [async ({ browserName }, use, testInfo) => {
    if (browserName !== "chromium") testInfo.skip();
    await use(undefined);
  }, { auto: true }],
});
```

**S91.** Extract `localStorage.getItem("mystoria-session-id")` evaluator to helper (session.spec.ts)

Same `page.evaluate(() => localStorage.getItem("mystoria-session-id"))` appears 3 times (lines 14–16, 27–29, 37–39):

```ts
// After
const getSessionId = (page: Page) =>
  page.evaluate(() => localStorage.getItem("mystoria-session-id"));
```

**S92.** Parametrize responsive viewport tests (responsive.spec.ts)

6 tests each set viewport + goto + wait for input. Extract viewport + setup:

```ts
// After
const viewports = { mobile: { width: 375, height: 667 }, desktop: { width: 1280, height: 720 } };

test.describe("mobile", () => {
  test.use({ viewport: viewports.mobile });
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByPlaceholder("Type a message...")).toBeEnabled({ timeout: 15000 });
  });
  // ... mobile-specific tests
});
```

Eliminates `setViewportSize` calls from each test.

**S93.** Extract "send message and wait for response" helper (text-chat.spec.ts)

Pattern repeated 4 times: fill input → click Send → wait for status:

```ts
// After
async function sendAndWait(page: Page, text: string) {
  await page.getByPlaceholder("Type a message...").fill(text);
  await page.getByRole("button", { name: "Send" }).click();
}
```

---

### Configuration

**S94.** Extract `process.env.CI` to const `IS_CI` (playwright.config.ts — checked 4 times on lines 6, 7, 8, 22)

```ts
// Before
forbidOnly: !!process.env.CI,
retries: process.env.CI ? 2 : 0,
workers: process.env.CI ? 1 : undefined,
// ...
reuseExistingServer: !process.env.CI,

// After
const IS_CI = !!process.env.CI;
// ...
forbidOnly: IS_CI,
retries: IS_CI ? 2 : 0,
workers: IS_CI ? 1 : undefined,
reuseExistingServer: !IS_CI,
```

**S95.** Playwright projects array via `.map()` (playwright.config.ts:14–18)

```ts
// Before: 3 manually written project objects
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
],

// After
const browsers = [
  ["chromium", "Desktop Chrome"],
  ["firefox", "Desktop Firefox"],
  ["webkit", "Desktop Safari"],
] as const;
projects: browsers.map(([name, device]) => ({ name, use: { ...devices[device] } })),
```

---

### Small Type/Interface Removals

**S96.** Remove `VoiceButtonProps` interface — used once (VoiceButton.tsx:3–7)

```ts
// Before: standalone interface + function parameter
interface VoiceButtonProps {
  status: AppStatus;
  onClick: () => void;
  disabled: boolean;
}
export function VoiceButton({ status, onClick, disabled }: VoiceButtonProps) {

// After: inline in function signature
export function VoiceButton({ status, onClick, disabled }: {
  status: AppStatus; onClick: () => void; disabled: boolean;
}) {
```

**S97.** Remove `TextInputProps` interface — used once (TextInput.tsx:3–5)

Same pattern as S96. Inline the type in the function signature.

**S98.** Remove `TtsConfig` interface — used only as ref type (useTextToSpeech.ts:8–11)

```ts
// Before
interface TtsConfig { apiKey: string; voiceId: string; }
const configRef = useRef<TtsConfig | null>(null);

// After: let TypeScript infer from getTtsConfig return
const configRef = useRef<{ apiKey: string; voiceId: string } | null>(null);
// Or better: const configRef = useRef<Awaited<ReturnType<typeof getTtsConfig>> | null>(null);
```

**S99.** Remove `CartesiaWS` type alias — used once (useTextToSpeech.ts:18–20)

```ts
// Before
type CartesiaWS = Awaited<ReturnType<InstanceType<typeof Cartesia>["tts"]["websocket"]>>;
const wsRef = useRef<CartesiaWS | null>(null);

// After: inline the type or use a simpler annotation
const wsRef = useRef<Awaited<ReturnType<InstanceType<typeof Cartesia>["tts"]["websocket"]>> | null>(null);
// Or: const wsRef = useRef<any>(null); // the type is only used for .context() and .close()
```

**S100.** Remove `MockInstance` interface from useSpeechRecognition.test.ts (lines 5–14)

```ts
// Before: 10-line interface used only for lastInstance type
interface MockInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}
let lastInstance: MockInstance | null = null;

// After: let TypeScript infer from the constructor
let lastInstance: ReturnType<typeof createMockConstructor> | null = null;
// Or inline the shape in createMockConstructor's return type
```

---

## Summary

| Category | Count | Severity |
|---|---|---|
| Unused code | 3 | Medium |
| Duplicated code | 4 | Low |
| Misplaced helpers | 4 | Low |
| Code quality | 6 | Medium |
| Naming/consistency | 3 | Low |
| Bugs & race conditions | 4 | Medium-High |
| Security | 12 | Critical-High |
| Test quality (unit) | 4 | Medium |
| Accessibility | 2 | Low |
| Configuration & CI/CD | 4 | Low-Medium |
| Schema design | 5 | Medium |
| E2E test issues | 4 | High |
| Frontend bugs | 3 | Medium |
| Backend test coverage | 1 | Medium |
| **Simplifications (S1–S50)** | **50** | **Low** |
| **Simplifications (S51–S100)** | **50** | **Low** |
| **Total** | **159** | |

| Category | Count | Severity |
|---|---|---|
| Unused code | 3 | Medium |
| Duplicated code | 4 | Low |
| Misplaced helpers | 4 | Low |
| Code quality | 6 | Medium |
| Naming/consistency | 3 | Low |
| Bugs & race conditions | 4 | Medium-High |
| Security | 12 | Critical-High |
| Test quality (unit) | 4 | Medium |
| Accessibility | 2 | Low |
| Configuration & CI/CD | 4 | Low-Medium |
| Schema design | 5 | Medium |
| E2E test issues | 4 | High |
| Frontend bugs | 3 | Medium |
| Backend test coverage | 1 | Medium |
| **Simplifications** | **50** | **Low** |
| **Total** | **100** | |

### Priority Order

1. **Critical** — Add authentication to all public endpoints (7.4) — without auth, all other security fixes are moot
2. **Critical** — Delete deprecated `synthesizeSpeech` (1.1 & 7.1) — removes open server-side API abuse vector
3. **Critical** — Add rate limiting on `sendMessage` and `createSession` (7.11) — prevents LLM API cost abuse
4. **Now** — Add prompt length limit on `sendMessage` (7.5) — prevents storage/token abuse
5. **Now** — Add input validation: string lengths on Zod schemas (7.2), date format (7.3, 7.10), limit bounds (7.7), array cap (7.6)
6. **Now** — Add security headers — CSP, X-Frame-Options, X-Content-Type-Options (7.8)
7. **Now** — Sanitize Cartesia error messages (7.9), guard verbose console logging (7.12)
8. **Now** — Fix E2E tests: add "Tap to start" step and fix session restore assertion (12.1, 12.2)
9. **Now** — Fix receive loop cancellation in `useTextToSpeech` (race condition, 6.1)
10. **Soon** — Fix `.toBeDefined()` test assertions (4.4, 8.1)
11. **Soon** — Add compound index on appointments.dateTime (11.4)
12. **Soon** — Add `VITE_CONVEX_URL` runtime check (13.2), fix untrimmed TextInput (13.1)
13. **Soon** — Apply high-impact simplifications: S1 (combine refs), S8 (LoadingDots), S22 (sessionTool wrapper), S28+S81-S83 (data-drive all seeds), S30 (consolidate chat handlers), S41+S90-S93 (E2E fixtures/helpers)
14. **Soon** — Remove dead code: S54 (unused isReady), S70 (LanguageModel import), S71 (console.log in getLanguageModel), S77 (voice ID constant)
15. **Later** — Consolidate date helpers, extract shared test mocks (S39+S84-S86), schema cleanup
16. **Later** — Add backend tests for data.ts/chat.ts (14.1)
17. **Later** — Deduplicate StreamingAudioPlayer: S67 (onended handler), S68 (bufferingDone), S69 (getMetrics reduce)
18. **Polish** — Remaining simplifications (S56-S66, S72-S76, S87-S100), CI optimizations, accessibility, naming consistency
