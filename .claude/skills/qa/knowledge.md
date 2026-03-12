# QA Product Knowledge

This file stores learned knowledge about how to test the product. Updated as new features are tested and new patterns are discovered.

## App URL

- Local dev: `http://localhost:5173`
- Production: `convex.rantapp.work`

## Known test flows

### Text chat (basic happy path)
1. Open the app
2. Wait for session to initialize (TextInput becomes enabled)
3. Type a message in the input field
4. Press Enter or click Send
5. Verify user message appears in transcript
6. Wait for assistant response (processing state)
7. Verify assistant message appears in transcript

### Page load health check
1. Navigate to the app URL
2. Verify no JS errors in console
3. Verify Header component renders with status
4. Verify TextInput is present
5. Verify network request for `createSession` mutation succeeds

### Streaming LLM + sentence-level TTS
1. Clear localStorage (`mystoria-session-id`) and reload for fresh session
2. Greeting should stream in incrementally and auto-play via Cartesia TTS
3. Status should cycle: idle → speaking → idle (for greeting)
4. Send a text message → status: idle → processing → speaking → idle
5. During "Speaking..." state, click mic button to stop audio mid-stream
6. Verify status returns to "Ready" after stop
7. Reload page — existing messages display, no audio replay, status stays "Ready"
8. Check console for errors — should be zero

### Cartesia WebSocket TTS verification
- The app now uses direct Cartesia WebSocket instead of REST TTS
- Check for `_ws.WebSocket is not a constructor` errors — indicates Vite ws shim issue
- If seen, verify `src/lib/ws-browser-shim.cjs` exists and `vite.config.ts` aliases `ws` to it
- Successful TTS shows "Speaking..." status and mic button changes to speaker icon

## Known limitations

- Web Speech API (voice) cannot be automated in headless browsers
- TTS playback can be partially verified: check status transitions (processing → speaking → idle) and absence of console errors
- Convex mutations may take a moment to propagate — add reasonable waits

## Selectors & landmarks

- Status indicator: `header span.text-sm` — shows "Ready", "Listening...", "Thinking...", or "Speaking..."
- Text input: `input[type="text"]` with placeholder "Type a message..."
- Send button: `button[type="submit"]`
- Message bubbles: user = `.bg-purple.text-white`, assistant = `.bg-white.text-gray-900`
- Mic button: teal circle at bottom-left of input area

## Status label mapping (Header.tsx)

- `idle` → "Ready"
- `listening` → "Listening..."
- `processing` → "Thinking..."
- `speaking` → "Speaking..."

## Known bugs

### ~~State machine stuck at "Thinking..." after text message~~ (RESOLVED 2026-03-11)
- **Resolution:** Fixed by streaming LLM implementation. The new streaming TTS effect in App.tsx tracks `message.status === "streaming"` instead of message count, which correctly handles pending→streaming→success lifecycle. The non-streaming TTS effect also now filters by `status !== "pending" && status !== "streaming"`, preventing the count mismatch issue.

### ~~TTS replays last message on page reload~~ (RESOLVED 2026-03-11)
- **Resolution:** Fixed by delaying `hasInitializedRef` until `messages.length > 0` in the non-streaming TTS effect. This ensures the baseline assistant count matches the fully-loaded message list, not the initial empty render.
