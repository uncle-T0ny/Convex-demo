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

## Known limitations

- Web Speech API (voice) cannot be automated in headless browsers
- TTS playback cannot be verified programmatically — check that `speak()` is called, not that audio plays
- Convex mutations may take a moment to propagate — add reasonable waits

## Selectors & landmarks

(To be discovered and recorded during testing sessions)
