import { useCallback, useRef } from "react";

interface SpeechRecognitionOptions {
  onResult: (transcript: string) => void;
  onEnd?: () => void;
}

interface SpeechRecognitionReturn {
  start: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function useSpeechRecognition({
  onResult,
  onEnd,
}: SpeechRecognitionOptions): SpeechRecognitionReturn {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        onResult(transcript);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      onEnd?.();
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      onEnd?.();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, onResult, onEnd]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  return { start, stop, isSupported };
}
