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

export type AppStatus = "idle" | "listening" | "processing" | "speaking";

export function App() {
  const [status, setStatus] = useState<AppStatus>("idle");
  const [sessionId, setSessionId] = useState<Id<"sessions"> | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const lastAssistantCountRef = useRef(0);

  const createSession = useMutation(api.sessions.createSession);
  const session = useQuery(
    api.sessions.getSession,
    sessionId ? { sessionId } : "skip",
  );
  const sendMessage = useMutation(api.chat.sendMessage);
  const { results: messages } = useUIMessages(
    api.chat.listMessages,
    session?.threadId ? { threadId: session.threadId } : "skip",
    { initialNumItems: 100 },
  );

  const dashboardData = useQuery(
    api.dashboard.getTodayOverview,
    sessionId ? { sessionId } : "skip",
  );

  const { speak, stop: stopSpeaking } = useTextToSpeech({
    onEnd: () => setStatus("idle"),
  });

  const handleSend = useCallback(
    async (text: string) => {
      if (!session?.threadId || !text.trim()) return;
      setStatus("processing");
      await sendMessage({ threadId: session.threadId, prompt: text.trim() });
    },
    [session?.threadId, sendMessage],
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

  // Initialize session on mount
  useEffect(() => {
    createSession({}).then(setSessionId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for new assistant messages to trigger TTS
  useEffect(() => {
    const assistantMessages = messages.filter(
      (m) => m.role === "assistant",
    );
    if (assistantMessages.length > lastAssistantCountRef.current) {
      const latest = assistantMessages[assistantMessages.length - 1];
      if (latest && status === "processing") {
        setStatus("speaking");
        speak(latest.text);
      }
    }
    lastAssistantCountRef.current = assistantMessages.length;
  }, [messages, status, speak]);

  const handleMicToggle = useCallback(() => {
    if (status === "idle") {
      setStatus("listening");
      startListening();
    } else if (status === "listening") {
      stopListening();
      setStatus("idle");
    } else if (status === "speaking") {
      stopSpeaking();
      setStatus("idle");
    }
  }, [status, startListening, stopListening, stopSpeaking]);

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

      {/* Status Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform border-r border-gray-200 bg-white transition-transform md:relative md:z-auto md:translate-x-0 ${
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
        />
        <Transcript messages={messages} status={status} />
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            {speechSupported && (
              <VoiceButton
                status={status}
                onClick={handleMicToggle}
                disabled={!isReady}
              />
            )}
            <TextInput
              onSend={handleSend}
              disabled={
                !isReady ||
                status === "processing" ||
                status === "speaking"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
