# Convex Voice Demo

A real-time voice assistant web app built as a demo/playground for [Convex](https://convex.dev) and [Claude Code](https://claude.ai/code). Users speak into their microphone (or type), see a live transcript, and hear AI responses read aloud.

**Live at** https://mystoria.rantapp.work/

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, Tailwind CSS 3 |
| Backend | Convex (real-time cloud database + serverless functions) |
| LLM | Configurable via env vars: Claude Haiku 4.5 or Cerebras GPT-OSS-120B (current), via `@convex-dev/agent` + Vercel AI SDK |
| TTS | Cartesia Sonic-3 (server-side, with Web Speech API fallback) |
| STT | Browser-native Web Speech API |
| Hosting | Cloudflare Pages (SPA) + Convex Cloud (backend) |
| Testing | Vitest (unit/integration), Playwright (E2E) |

## How It Works

### Architecture

```
Browser (Cloudflare Pages SPA)
  └─ React App
       ├─ Web Speech API (mic → text)
       ├─ Cartesia Sonic-3 via Convex action (text → expressive speech)
       └─ Convex Client (WebSocket)
              └─ Convex Cloud
                   ├─ sessions, tasks, medications, appointments tables
                   ├─ @convex-dev/agent (threads + messages)
                   └─ Actions → LLM (configurable) + Cartesia TTS
```

### Data Flow

1. **VoiceButton** captures speech via Web Speech API (or user types in TextInput)
2. Frontend calls the `sendMessage` Convex action
3. The action invokes the LLM agent via `@convex-dev/agent`
4. The agent writes the response to the Convex database
5. A reactive query (`useQuery`) auto-updates the Transcript component
6. The response is sent to Cartesia Sonic-3 for text-to-speech and played back

### UI State Machine

The entire UI is driven by a single state machine:

```
idle → listening → processing → speaking → idle
```

Defined as the `AppStatus` type in `src/App.tsx`.

### How Convex Is Used

- **Mutations** — synchronous database writes (e.g., creating sessions, saving messages)
- **Actions** — call external APIs like Claude and Cartesia; write results back via `ctx.runMutation`
- **Queries** — reactive subscriptions that auto-update the frontend via `useQuery`/`usePaginatedQuery`
- **Scheduler** — `ctx.scheduler.runAfter(0, ...)` triggers async work (e.g., thread initialization) after session creation
- **`@convex-dev/agent`** — manages LLM conversation threads and message persistence

The main system prompt for the AI agent lives in `convex/agent.ts` (`MYSTORIA_INSTRUCTIONS` constant).

Backend env vars (API keys) are set in the Convex dashboard, not in `.env` files. Only `VITE_CONVEX_URL` goes in `.env.local`.

## Quick Start

```bash
cp .env.example .env.local        # Add your VITE_CONVEX_URL
npm install
npm run dev                        # Starts Convex sync + Vite on :5173
```

### Server-side env vars

Set these in the Convex dashboard (not in `.env` files):

```bash
npx convex env set CARTESIA_API_KEY <your-key>
# Optional: override default voice (defaults to "Helpful Woman")
npx convex env set CARTESIA_VOICE_ID <voice-id>

# LLM provider — defaults to Anthropic Claude Haiku 4.5
# Currently running Cerebras GPT-OSS-120B in production:
npx convex env set LLM_PROVIDER cerebras
npx convex env set LLM_MODEL gpt-oss-120b
npx convex env set CEREBRAS_API_KEY <your-key>
```

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Convex sync + Vite dev server (concurrent) |
| `npm run dev:frontend` | Vite only (port 5173) |
| `npm run dev:convex` | Convex sync only |
| `npm run build` | Production build to `dist/` |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint (zero warnings enforced) |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | Playwright (all browsers) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run ci` | Full pipeline: typecheck + lint + test + build |

## UI Kit

A standalone component showcase page — no backend required.

```
http://localhost:5173/ui-kit.html
```

Three tabs: **Foundations** (colors, typography, animations, spacing), **Components** (Mascot, Header, VoiceButton, Transcript, TextInput), **Patterns** (full app compositions). Excluded from production builds.

## Claude Code Skills

This project uses [Claude Code](https://claude.ai/code) with custom skills (`.claude/skills/`) that automate common development workflows:

| Skill | Trigger | What it does |
|-------|---------|-------------|
| `commiter` | `/commit` or "commit" | Analyzes staged/unstaged changes, creates conventional commits with proper type/scope |
| `e2e` | Mentions e2e tests or after new features | Writes, debugs, fixes, and runs Playwright E2E tests |
| `qa` | "test this", "is this working?" | Tests features end-to-end via browser automation (Chrome). Self-learning — saves discovered product knowledge for future sessions |
| `ui-kit-review` | Auto after editing `src/components/*.tsx` | Checks if the UI Kit showcase needs a new section for added/changed components |

Skills are defined in `.claude/skills/<name>/SKILL.md` and may have accompanying `lessons.md` (mistakes to avoid) and `inventory.md`/`knowledge.md` (accumulated context).

## Ralph Loop (Automated Audit Fix Loop)

[Ralph Loop](https://github.com/anthropics/claude-plugins-official/tree/main/ralph-loop) is a Claude Code plugin that runs an autonomous iteration loop. In this project, it works through `CODE_AUDIT.md` issues one at a time: pick an issue, fix it, verify (typecheck + lint + test), commit, update the tracker, repeat.

### Prerequisites

```bash
brew install yq                    # YAML parser (required by the runner script)
```

The `ralph-loop` Claude Code plugin must be installed. It provides the `/ralph-loop:ralph-loop` skill that powers the iteration.

### Running

```bash
./scripts/ralph/ralph_run.sh
```

You'll see a menu of available prompts:

| Prompt | What it does | Max iterations |
|--------|-------------|----------------|
| `audit-fix` | Fix ALL open issues in priority order (Critical/Security first) | 200 |
| `audit-fix-security` | Fix only security issues (7.1–7.12) | 20 |
| `audit-fix-simplify` | Apply code simplifications (S1–S100) | 120 |

Select a prompt by number or name, confirm, and the loop starts. Each iteration:

1. Reads `CODE_AUDIT.md`, picks the next Open issue
2. Implements the fix
3. Runs `npm run typecheck && npm run lint && npm run test:run`
4. Updates the tracker table (Status: Open → Fixed, adds commit hash)
5. Commits with `fix(<area>): <description> [audit #<id>]`

The loop exits when all issues are Fixed or Skipped.

### Adding Custom Prompts

Edit `scripts/ralph/prompts.yml`. Each prompt has three fields:

```yaml
my-prompt:
  task: |
    Step-by-step instructions for what Claude should do each iteration.
  exit_condition: |
    When to stop. Must be verifiable — Claude outputs <promise>text</promise>
    only when the condition is genuinely true.
  max_iterations: 50
```

### Monitoring

```bash
# Current iteration:
grep '^iteration:' .claude/ralph-loop.local.md

# Full loop state:
head -10 .claude/ralph-loop.local.md

# Cancel the loop (from another terminal):
rm .claude/ralph-loop.local.md
```

## Testing

| Type | Location | Runner | Environment |
|------|----------|--------|-------------|
| Backend unit/integration | `convex/__tests__/` | Vitest + `convex-test` | `edge-runtime` |
| Frontend unit | `src/__tests__/` | Vitest + `@testing-library/react` | `jsdom` |
| E2E | `e2e/` | Playwright | Chromium, Firefox, WebKit |

Run a single test file: `npx vitest run path/to/test.ts`

Voice features require manual testing (browser API limitations in headless mode).

## Deployment

```bash
npx convex deploy --cmd 'npm run build'                            # Backend + frontend build
npx wrangler pages deploy dist --project-name convex-voice-demo    # Cloudflare Pages
```

CI/CD: push to `main` → GitHub Actions → typecheck → lint → test → deploy (Convex + Cloudflare Pages). PRs run checks only.
