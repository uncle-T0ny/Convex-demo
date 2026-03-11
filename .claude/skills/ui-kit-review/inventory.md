# UI Kit Inventory

Current state of the component showcase. Updated after every UI Kit change.

## Showcased components

| Component | Section file | Variants shown | Last verified |
|-----------|-------------|----------------|---------------|
| Header | `HeaderSection.tsx` | 4 (idle, listening, processing, speaking) | 2026-03-11 |
| VoiceButton | `VoiceButtonSection.tsx` | 8 (4 statuses × enabled/disabled) | 2026-03-11 |
| Transcript | `TranscriptSection.tsx` | 5 (empty, user-only, assistant-only, mixed, filtered) | 2026-03-11 |
| TextInput | `TextInputSection.tsx` | 2 (enabled, disabled) | 2026-03-11 |

## Components NOT in showcase (intentionally)

(None currently — all `src/components/` components are showcased.)

## Notes

- UI Kit is excluded from production builds (mode check in `vite.config.ts`)
- Dev access: `http://localhost:5173/ui-kit.html`
- `Message` type is exported from `src/components/Transcript.tsx` for use by the showcase
- `AppStatus` type is imported via `import type` from `src/App.tsx` (compile-time only)
