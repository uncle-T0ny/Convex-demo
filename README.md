# MyStoria

Fertility treatment voice companion. Speak into your mic, see a live transcript, and hear warm, expressive AI responses read aloud.

**Stack:** React 18 + Vite 6 + Tailwind CSS 3 | Convex backend | Claude Haiku 4.5 | Cartesia Sonic-3 TTS (Web Speech API fallback)

**Live at** `convex.rantapp.work`

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
```

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Convex sync + Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint (zero warnings) |
| `npm run test:run` | Vitest single run |
| `npm run test:e2e` | Playwright (all browsers) |
| `npm run ci` | Full pipeline: typecheck + lint + test + build |

## UI Kit

A standalone component showcase page — no backend required.

```
http://localhost:5173/ui-kit.html
```

Three tabs: **Foundations** (colors, typography, animations, spacing), **Components** (Mascot, Header, VoiceButton, Transcript, TextInput), **Patterns** (full app compositions). Excluded from production builds.

## Claude Code Skills

Custom skills live in `.claude/skills/`:

| Skill | Trigger | What it does |
|-------|---------|-------------|
| `commiter` | `/commit` or "commit" | Analyzes changes, creates conventional commits |
| `e2e` | Mentions e2e tests or after new features | Writes/debugs/runs Playwright tests |
| `qa` | "test this", "is this working?" | Browser-automation QA with self-learning |
| `ui-kit-review` | Auto after editing `src/components/*.tsx` | Checks if UI Kit needs a new section |

## Architecture

```
Browser (Cloudflare Pages SPA)
  └─ React App
       ├─ Web Speech API (mic → text)
       ├─ Cartesia Sonic-3 via Convex action (text → expressive speech)
       └─ Convex Client (WebSocket)
              └─ Convex Cloud
                   ├─ sessions, tasks, medications, appointments tables
                   ├─ @convex-dev/agent (threads + messages)
                   └─ Actions → Claude Haiku 4.5 + Cartesia TTS
```

UI state machine: `idle → listening → processing → speaking → idle`

### Text-to-Speech

TTS is handled server-side via a Convex action that calls the [Cartesia Sonic-3](https://cartesia.ai) REST API. Sonic-3 provides auto-emotion detection — it interprets emotional subtext from the transcript and adjusts tone automatically (warmth, sympathy, excitement). The MP3 audio is returned to the browser and played via `HTMLAudioElement`. If Cartesia is unavailable, the app falls back to the browser's built-in Web Speech API.

## Deployment

```bash
npx convex deploy --cmd 'npm run build'
npx wrangler pages deploy dist --project-name convex-voice-demo
```

CI/CD: push to `main` → GitHub Actions → typecheck → lint → test → deploy (Convex + Cloudflare Pages). PRs run checks only.

## Automated Audit Fix Loop (Ralph Loop)

An autonomous Claude Code loop that works through `CODE_AUDIT.md` issues one at a time — pick, fix, verify, commit, repeat.

### Prerequisites

```bash
brew install yq                    # YAML parser (required by runner script)
```

The [ralph-loop](https://github.com/anthropics/claude-plugins-official/tree/main/ralph-loop) Claude Code plugin must be installed. It provides the `/ralph-loop:ralph-loop` skill that powers the iteration loop.

### Running

```bash
./scripts/ralph/ralph_run.sh
```

You'll see a menu of available prompts:

| Prompt | What it does | Max iterations |
|--------|-------------|----------------|
| `audit-fix` | Fix ALL issues in priority order (Critical/Security first) | 200 |
| `audit-fix-security` | Fix only security issues (7.1–7.12) | 20 |
| `audit-fix-simplify` | Apply code simplifications (S1–S100) | 120 |

Select a prompt by number or name, confirm, and the loop starts. Each iteration:

1. Reads `CODE_AUDIT.md`, picks the next Open issue
2. Implements the fix
3. Runs `typecheck + lint + test` to verify
4. Updates the tracker table (Status → Fixed, adds commit hash)
5. Commits with `fix(<area>): <description> [audit #<id>]`

The loop exits when all issues are Fixed/Skipped (verified by `grep -c "| Open |" CODE_AUDIT.md` returning 0).

### Monitoring

```bash
# Current iteration:
grep '^iteration:' .claude/ralph-loop.local.md

# Full loop state:
head -10 .claude/ralph-loop.local.md

# Cancel the loop (from another terminal):
rm .claude/ralph-loop.local.md
```

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
