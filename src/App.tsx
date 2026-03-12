import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Header } from "./components/Header";
import { Transcript } from "./components/Transcript";
import { VoiceButton } from "./components/VoiceButton";
import { TextInput } from "./components/TextInput";
import { StatusPanel } from "./components/StatusPanel";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useTextToSpeech } from "./hooks/useTextToSpeech";
import { useDemoLimit } from "./hooks/useDemoLimit";
import { DemoLimitModal } from "./components/DemoLimitModal";
import { extractCompleteSentences } from "./lib/extractCompleteSentences";
import type { AudioPipelineMetrics, PipelineTimings } from "./lib/audioTelemetry";

export type AppStatus = "idle" | "listening" | "processing" | "speaking";

const SESSION_KEY = "mystoria-session-id";

export function App() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hiddenMsgKey, setHiddenMsgKey] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const { limitReached, increment } = useDemoLimit();
  const lastAssistantCountRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const messageSentMsRef = useRef(0);
  // Track which message is currently being spoken to prevent duplicate TTS
  const spokenMsgRef = useRef<string | null>(null);
  const preparePhaseRef = useRef(false);
  // Skip TTS until user has interacted (Chrome autoplay policy)
  const userInteractedRef = useRef(false);
  // Refs for auto-listen after TTS (avoids circular dep with useSpeechRecognition)
  const startListeningRef = useRef<(() => void) | null>(null);
  const speechSupportedRef = useRef(false);

  const createSession = useMutation(api.sessions.createSession);
  const session = useQuery(
    api.sessions.getSession,
    sessionId ? { sessionId } : "skip",
  );
  const sendMessage = useMutation(api.chat.sendMessage);
  const { results: messages } = useUIMessages(
    api.chat.listMessages,
    session?.threadId ? { threadId: session.threadId } : "skip",
    { initialNumItems: 100, stream: true },
  );

  const dashboardData = useQuery(
    api.dashboard.getTodayOverview,
    sessionId ? { sessionId } : "skip",
  );

  const handleMetrics = useCallback(
    (metrics: AudioPipelineMetrics) => {
      if (!import.meta.env.DEV) return;
      const sentMs = messageSentMsRef.current;
      const timings: PipelineTimings = {
        userMessageSentMs: sentMs,
        firstAudioChunkMs: metrics.firstChunkArrivalMs,
        lastAudioEndMs: metrics.lastChunkEndMs,
        audioMetrics: metrics,
        timeToFirstAudioMs: sentMs
          ? metrics.firstChunkArrivalMs - sentMs
          : 0,
        totalLatencyMs: sentMs ? metrics.lastChunkEndMs - sentMs : 0,
      };
      const gapMs = Math.round(metrics.totalGapSeconds * 1000);
      const maxGapMs = Math.round(metrics.maxGapSeconds * 1000);
      console.log(
        `[Audio Pipeline] timeToFirstAudio=${Math.round(timings.timeToFirstAudioMs)}ms` +
          ` totalLatency=${Math.round(timings.totalLatencyMs)}ms` +
          ` gaps=${metrics.gapCount} (${gapMs}ms)` +
          ` maxGap=${maxGapMs}ms`,
      );
    },
    [],
  );

  const handleEnd = useCallback(() => {
    if (started && speechSupportedRef.current && startListeningRef.current) {
      setStatus("listening");
      startListeningRef.current();
    } else {
      setStatus("idle");
    }
  }, [started]);

  const {
    stop: stopSpeaking,
    destroy: destroyTts,
    warmup,
    startStream,
    pushText,
    endStream,
  } = useTextToSpeech({
    onEnd: handleEnd,
    onMetrics: handleMetrics,
  });

  // Track sentence-level streaming TTS state
  const ttsSentenceIndexRef = useRef(0);
  const ttsStreamingMsgKeyRef = useRef<string | null>(null);
  const ttsStreamStartedRef = useRef(false);

  const handleSend = useCallback(
    async (text: string) => {
      if (!session?.threadId || !text.trim()) return;
      if (limitReached) return;
      increment();
      userInteractedRef.current = true;
      stopSpeaking();
      setHiddenMsgKey(null);
      preparePhaseRef.current = false;
      ttsSentenceIndexRef.current = 0;
      ttsStreamingMsgKeyRef.current = null;
      ttsStreamStartedRef.current = false;
      messageSentMsRef.current = performance.now();
      setStatus("processing");
      await sendMessage({ threadId: session.threadId, prompt: text.trim() });
    },
    [session?.threadId, sendMessage, stopSpeaking, limitReached, increment],
  );

  const {
    start: startListening,
    stop: stopListening,
    isSupported: speechSupported,
  } = useSpeechRecognition({
    onResult: (transcript) => {
      handleSend(transcript);
    },
    onEnd: () => {
      setStatus((s) => (s === "listening" ? "idle" : s));
    },
  });

  // Keep refs in sync for auto-listen after TTS
  startListeningRef.current = startListening;
  speechSupportedRef.current = speechSupported;

  // Always create a fresh session on mount (guard against React strict mode double-fire)
  const sessionCreatedRef = useRef(false);
  useEffect(() => {
    if (sessionCreatedRef.current) return;
    sessionCreatedRef.current = true;
    createSession({ tzOffset: new Date().getTimezoneOffset() })
      .then((id) => {
        setSessionId(id);
        localStorage.setItem(SESSION_KEY, id);
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(() => {
    userInteractedRef.current = true;
    spokenMsgRef.current = null;
    // Pre-connect Cartesia WebSocket while LLM processes
    warmup();
    // Hide the greeting message during TTS preparation
    const assistantMsgs = messages.filter((m) => m.role === "assistant");
    const latest = assistantMsgs[assistantMsgs.length - 1];
    if (latest) setHiddenMsgKey(latest.key);
    setStatus("processing");
    setStarted(true);
  }, [messages, warmup]);

  // Early-hide effect: immediately hide new assistant messages to prevent text flash
  useEffect(() => {
    const assistantMsgs = messages.filter((m) => m.role === "assistant");

    if (!hasInitializedRef.current) {
      if (messages.length > 0) {
        lastAssistantCountRef.current = assistantMsgs.length;
        hasInitializedRef.current = true;
        // Mark existing messages as already spoken so TTS effect skips them
        const latest = assistantMsgs[assistantMsgs.length - 1];
        if (latest) spokenMsgRef.current = latest.key;
      }
      return;
    }

    if (assistantMsgs.length <= lastAssistantCountRef.current) return;

    lastAssistantCountRef.current = assistantMsgs.length;

    const latest = assistantMsgs[assistantMsgs.length - 1];
    if (!latest) return;

    const msgKey = latest.key;
    if (spokenMsgRef.current !== msgKey) {
      if (userInteractedRef.current) {
        // Hide until TTS is ready
        setHiddenMsgKey(msgKey);
      } else {
        // No user interaction yet (e.g. greeting) — show text immediately, skip TTS
        spokenMsgRef.current = msgKey;
      }
    }
  }, [messages]);

  // Processing timeout: recover from stuck state (e.g. LLM action crash)
  useEffect(() => {
    if (status !== "processing") return;
    const timer = setTimeout(() => {
      console.warn("[App] Processing timeout — resetting to idle");
      setHiddenMsgKey(null);
      preparePhaseRef.current = false;
      ttsStreamingMsgKeyRef.current = null;
      ttsStreamStartedRef.current = false;
      setStatus("idle");
    }, 20_000);
    return () => clearTimeout(timer);
  }, [status]);

  // Streaming TTS effect: sends sentences to TTS as they appear during streaming
  useEffect(() => {
    if (!hasInitializedRef.current || !started) return;

    const assistantMsgs = messages.filter((m) => m.role === "assistant");
    if (assistantMsgs.length === 0) return;

    // Check for failed messages — the latest may have no text (e.g. tool call step that failed)
    const latest = assistantMsgs[assistantMsgs.length - 1];
    if (latest && latest.status === "failed" && spokenMsgRef.current !== latest.key) {
      setHiddenMsgKey(null);
      setStatus("idle");
      spokenMsgRef.current = latest.key;
      ttsStreamingMsgKeyRef.current = null;
      ttsStreamStartedRef.current = false;
      return;
    }

    // Find the latest assistant message (streaming or complete) with text
    let target: (typeof assistantMsgs)[number] | undefined;
    for (let i = assistantMsgs.length - 1; i >= 0; i--) {
      const m = assistantMsgs[i];
      if (!m.text.replace(/[^\p{L}\p{N}]/gu, "").trim()) continue;
      target = m;
      break;
    }

    if (!target) return;

    const msgKey = target.key;
    const isComplete = target.status !== "streaming" && target.status !== "pending";

    // New message — start streaming TTS
    if (ttsStreamingMsgKeyRef.current !== msgKey && spokenMsgRef.current !== msgKey) {
      ttsStreamingMsgKeyRef.current = msgKey;
      ttsSentenceIndexRef.current = 0;
      ttsStreamStartedRef.current = false;
      preparePhaseRef.current = true;

      // Start streaming session in background
      startStream()
        .then(() => {
          if (ttsStreamingMsgKeyRef.current !== msgKey) return; // interrupted
          ttsStreamStartedRef.current = true;
          // Reveal text and switch to speaking as soon as first audio chunk arrives
          setHiddenMsgKey(null);
          setStatus("speaking");
          preparePhaseRef.current = false;

          // Push any sentences that accumulated while stream was starting
          const { sentences } = extractCompleteSentences(target!.text);
          if (sentences.length > ttsSentenceIndexRef.current) {
            const newSentences = sentences.slice(ttsSentenceIndexRef.current);
            for (const sentence of newSentences) {
              pushText(sentence);
            }
            ttsSentenceIndexRef.current = sentences.length;
          }
          // If message already complete, push remainder and end
          if (isComplete) {
            const { remainder } = extractCompleteSentences(target!.text);
            if (remainder.trim()) {
              pushText(remainder);
            }
            endStream();
            spokenMsgRef.current = msgKey;
            ttsStreamingMsgKeyRef.current = null;
          }
        })
        .catch((e) => {
          console.error("[TTS] startStream failed:", e);
          preparePhaseRef.current = false;
          setHiddenMsgKey(null);
          setStatus("idle");
          ttsStreamingMsgKeyRef.current = null;
        });
      return;
    }

    // Ongoing streaming message — push new sentences
    if (ttsStreamingMsgKeyRef.current === msgKey && ttsStreamStartedRef.current) {
      const { sentences, remainder } = extractCompleteSentences(target.text);
      if (sentences.length > ttsSentenceIndexRef.current) {
        const newSentences = sentences.slice(ttsSentenceIndexRef.current);
        for (const sentence of newSentences) {
          pushText(sentence);
        }
        ttsSentenceIndexRef.current = sentences.length;
      }
      // When message completes, push remainder and close stream
      if (isComplete) {
        if (remainder.trim()) {
          pushText(remainder);
        }
        endStream();
        spokenMsgRef.current = msgKey;
        ttsStreamingMsgKeyRef.current = null;
      }
    }
  }, [messages, startStream, pushText, endStream, started]);

  const handleReset = useCallback(async () => {
    destroyTts();
    setStatus("idle");
    setStarted(false);
    lastAssistantCountRef.current = 0;
    hasInitializedRef.current = false;
    spokenMsgRef.current = null;
    setHiddenMsgKey(null);
    preparePhaseRef.current = false;
    userInteractedRef.current = false;
    ttsSentenceIndexRef.current = 0;
    ttsStreamingMsgKeyRef.current = null;
    ttsStreamStartedRef.current = false;
    const id = await createSession({ tzOffset: new Date().getTimezoneOffset() });
    setSessionId(id);
    localStorage.setItem(SESSION_KEY, id);
  }, [createSession, destroyTts]);

  // Watch for agent-triggered reset
  useEffect(() => {
    if (session?.resetRequested) {
      handleReset();
    }
  }, [session?.resetRequested, handleReset]);

  const handleMicToggle = useCallback(() => {
    if (limitReached) return;
    userInteractedRef.current = true;
    if (status === "idle") {
      setStatus("listening");
      startListening();
    } else if (status === "listening") {
      stopListening();
      setStatus("idle");
    } else if (status === "speaking") {
      stopSpeaking();
      setStatus("idle");
    } else if (status === "processing") {
      stopSpeaking();
      preparePhaseRef.current = false;
      ttsStreamingMsgKeyRef.current = null;
      ttsStreamStartedRef.current = false;
      setHiddenMsgKey(null);
      setStatus("idle");
    }
  }, [status, startListening, stopListening, stopSpeaking, limitReached]);

  const isReady = !!session?.threadId;

  return (
    <div className="flex h-screen bg-coral-light">
      {/* Mobile overlay */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setPanelOpen(false)}
        />
      )}

      {limitReached && <DemoLimitModal />}

      {/* Status Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-80 transform border-r border-gray-200 bg-white transition-transform md:relative md:z-auto md:translate-x-0 ${
          panelOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <StatusPanel
          data={dashboardData ?? undefined}
          onClose={() => setPanelOpen(false)}
        />
      </aside>

      {/* Main chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          status={status}
          onTogglePanel={() => setPanelOpen((p) => !p)}
          onReset={handleReset}
        />
        <div className="flex flex-1 justify-center overflow-hidden">
          <div className="flex w-full max-w-3xl flex-col">
            <Transcript
              messages={messages}
              status={status}
              hiddenMessageKey={hiddenMsgKey}
              started={started}
              onStart={handleStart}
            />
            {started && (
              <div className="rounded-t-2xl bg-white p-4">
                <div className="flex items-center gap-3">
                  {speechSupported && (
                    <VoiceButton
                      status={status}
                      onClick={handleMicToggle}
                      disabled={!isReady || limitReached}
                    />
                  )}
                  <TextInput
                    onSend={handleSend}
                    disabled={
                      !isReady ||
                      status === "processing" ||
                      status === "speaking" ||
                      limitReached
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
