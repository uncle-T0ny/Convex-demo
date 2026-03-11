import { useCallback, useRef } from "react";

interface TextToSpeechOptions {
  onEnd?: () => void;
}

export function useTextToSpeech({ onEnd }: TextToSpeechOptions) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;

      utterance.onend = () => {
        utteranceRef.current = null;
        onEnd?.();
      };
      utterance.onerror = () => {
        utteranceRef.current = null;
        onEnd?.();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [onEnd],
  );

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
  }, []);

  return { speak, stop };
}
