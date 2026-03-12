# QA Lessons

Record mistakes and learnings here so they are not repeated.

## Format

```
### YYYY-MM-DD — Short title
**What happened:** ...
**Root cause:** ...
**Fix / rule:** ...
```

---

### 2026-03-11 — Cartesia SDK WebSocket error in browser
**What happened:** Cartesia SDK threw `TypeError: _ws.WebSocket is not a constructor` in the browser. The SDK was taking the Node.js code path instead of the browser path.
**Root cause:** The `ws` npm package was installed (transitive dependency) and Vite bundled it into the browser build. The SDK checks `if (_ws)` — since `ws/browser.js` exports a truthy function, the SDK took the Node path instead of native WebSocket.
**Fix / rule:** Added `ws-browser-shim.cjs` (`module.exports = undefined`) and aliased `ws` to it in `vite.config.ts`. After changing Vite config, always clear `.vite` cache (`rm -rf node_modules/.vite`) and restart dev server.

### 2026-03-11 — TTS replays last message on page reload
**What happened:** Reloading the page triggered TTS for the last assistant message instead of staying silent with status "Ready".
**Root cause:** `useUIMessages` returns `[]` on first render, then all messages on second render. The non-streaming TTS effect initialized `lastAssistantCountRef = 0` on the empty render, then saw a count jump (0 → N) and spoke the last message.
**Fix / rule:** Only set `hasInitializedRef = true` when `messages.length > 0`, so the baseline count is set from the fully-loaded message list. New messages (greeting) are handled by the streaming TTS effect.
