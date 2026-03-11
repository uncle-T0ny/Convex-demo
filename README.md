# Convex Voice Demo

Real-time voice assistant. Speak into your mic, see a live transcript, hear AI responses read aloud.

**Stack:** React 18 + Vite 6 + Tailwind CSS 3 | Convex backend | Claude Haiku 4.5 | Web Speech API

## Quick Start

```bash
cp .env.example .env.local        # Add your VITE_CONVEX_URL
npm install
npm run dev                        # Starts Convex sync + Vite on :5173
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
Browser (SPA)
  └─ React App
       ├─ Web Speech API (STT/TTS)
       └─ Convex Client (WebSocket)
              └─ Convex Cloud
                   ├─ sessions table
                   ├─ @convex-dev/agent (threads + messages)
                   └─ Actions → Claude Haiku 4.5
```

UI state machine: `idle → listening → processing → speaking → idle`

## Deployment

```bash
npx convex deploy --cmd 'npm run build'
npx wrangler pages deploy dist --project-name convex-voice-demo
```

Live at `convex.rantapp.work`.
