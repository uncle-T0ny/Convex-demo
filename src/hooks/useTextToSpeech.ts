import { useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface TextToSpeechOptions {
  onEnd?: () => void;
}

export function useTextToSpeech({ onEnd }: TextToSpeechOptions) {
  const synthesize = useAction(api.chat.synthesizeSpeech);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    audioRef.current = null;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    cleanup();
    window.speechSynthesis?.cancel();
  }, [cleanup]);

  const speak = useCallback(
    async (text: string) => {
      stop();

      try {
        const audioBytes = await synthesize({ text });
        const blob = new Blob([audioBytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          cleanup();
          onEnd?.();
        };
        audio.onerror = () => {
          cleanup();
          onEnd?.();
        };
        await audio.play();
      } catch {
        // Fallback to Web Speech API
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => onEnd?.();
        utterance.onerror = () => onEnd?.();
        window.speechSynthesis.speak(utterance);
      }
    },
    [synthesize, onEnd, stop, cleanup],
  );

  return { speak, stop };
}
