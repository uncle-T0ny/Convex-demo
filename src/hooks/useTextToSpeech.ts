import { useCallback, useRef, useState } from "react";
import { useAction } from "convex/react";
import Cartesia from "@cartesia/cartesia-js";
import { api } from "../../convex/_generated/api";
import { StreamingAudioPlayer } from "../lib/StreamingAudioPlayer";
import type { AudioPipelineMetrics } from "../lib/audioTelemetry";

interface TtsConfig {
  apiKey: string;
  voiceId: string;
}

interface TextToSpeechOptions {
  onEnd?: () => void;
  onMetrics?: (metrics: AudioPipelineMetrics) => void;
}

type CartesiaWS = Awaited<
  ReturnType<InstanceType<typeof Cartesia>["tts"]["websocket"]>
>;

type CartesiaContext = ReturnType<CartesiaWS["context"]>;

const SAMPLE_RATE = 44100;

export function useTextToSpeech({ onEnd, onMetrics }: TextToSpeechOptions) {
  const getTtsConfig = useAction(api.chat.getTtsConfig);
  const configRef = useRef<TtsConfig | null>(null);
  const playerRef = useRef<StreamingAudioPlayer | null>(null);
  const wsRef = useRef<CartesiaWS | null>(null);
  const ttsCtxRef = useRef<CartesiaContext | null>(null);
  const fallbackTextRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const [isReady, setIsReady] = useState(false);

  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;
  const onMetricsRef = useRef(onMetrics);
  onMetricsRef.current = onMetrics;

  const stop = useCallback(() => {
    // Invalidate any in-flight receive loops
    generationRef.current++;

    // Stop audio player
    playerRef.current?.stop();
    playerRef.current = null;

    // Clear TTS context
    ttsCtxRef.current = null;

    // Keep WebSocket open for reuse by next stream

    // Clear ready state
    setIsReady(false);
    fallbackTextRef.current = null;

    // Cancel Web Speech fallback
    window.speechSynthesis?.cancel();
  }, []);

  /** Full teardown — closes WebSocket. Use on reset/unmount. */
  const destroy = useCallback(() => {
    stop();
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Already closed
      }
      wsRef.current = null;
    }
  }, [stop]);

  /** Pre-connect Cartesia WebSocket (call on user interaction / app start) */
  const warmup = useCallback(async () => {
    try {
      if (!configRef.current) {
        configRef.current = await getTtsConfig();
      }
      if (!wsRef.current) {
        const client = new Cartesia({ apiKey: configRef.current.apiKey });
        const ws = await client.tts.websocket();
        ws.on("error", (e: unknown) => {
          if (import.meta.env.DEV) console.error("[TTS] WebSocket error:", e);
          wsRef.current = null;
        });
        wsRef.current = ws;
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn("[TTS] warmup failed:", e);
    }
  }, [getTtsConfig]);

  /** Ensure WS is connected (reuses warmup result if available) */
  const ensureWs = useCallback(async () => {
    if (!configRef.current) {
      configRef.current = await getTtsConfig();
    }
    if (!wsRef.current) {
      const client = new Cartesia({ apiKey: configRef.current.apiKey });
      const ws = await client.tts.websocket();
      ws.on("error", (e: unknown) => {
        console.error("[TTS] WebSocket error:", e);
        wsRef.current = null;
      });
      wsRef.current = ws;
    }
  }, [getTtsConfig]);

  /**
   * Start a streaming TTS session. Audio plays as chunks arrive (no full buffering).
   * Resolves once the TTS context is ready to accept text (caller should pushText after).
   */
  const startStream = useCallback(async (): Promise<void> => {
    stop();

    try {
      await ensureWs();

      const player = new StreamingAudioPlayer({
        sampleRate: SAMPLE_RATE,
        buffered: false, // Stream — play chunks immediately
        onEnd: () => {
          const metrics = player.getMetrics();
          if (metrics) onMetricsRef.current?.(metrics);
          playerRef.current = null;
          onEndRef.current?.();
        },
      });
      playerRef.current = player;

      const ttsCtx = wsRef.current!.context({
        model_id: "sonic-3",
        voice: {
          mode: "id" as const,
          id: configRef.current!.voiceId,
        },
        output_format: {
          container: "raw" as const,
          encoding: "pcm_f32le" as const,
          sample_rate: SAMPLE_RATE,
        },
      });
      ttsCtxRef.current = ttsCtx;

      // Background receive loop — plays audio chunks as they arrive
      const loopWs = wsRef.current;
      const gen = generationRef.current;
      (async () => {
        try {
          for await (const event of ttsCtx.receive()) {
            if (gen !== generationRef.current) break;
            if (event.type === "chunk" && event.audio) {
              const bytes =
                event.audio instanceof ArrayBuffer
                  ? new Uint8Array(event.audio)
                  : new Uint8Array(
                      event.audio.buffer,
                      event.audio.byteOffset,
                      event.audio.byteLength,
                    );
              const float32 = new Float32Array(
                bytes.buffer.slice(
                  bytes.byteOffset,
                  bytes.byteOffset + bytes.byteLength,
                ),
              );
              player.appendChunk(float32);
            }
          }
        } catch (e) {
          if (import.meta.env.DEV) console.warn("[TTS] receive loop ended:", e);
          if (wsRef.current === loopWs) wsRef.current = null;
        }
        if (gen === generationRef.current) player.markStreamComplete();
      })();

      setIsReady(true);
    } catch (e) {
      if (import.meta.env.DEV) console.warn("[TTS] Cartesia streaming failed:", e);
      setIsReady(true);
    }
  }, [stop, ensureWs]);

  /** Push a sentence/chunk of text to the active TTS stream */
  const pushText = useCallback((text: string) => {
    if (ttsCtxRef.current) {
      ttsCtxRef.current.push({ transcript: text }).catch((e) => {
        if (import.meta.env.DEV) console.warn("[TTS] pushText failed:", e);
      });
    }
  }, []);

  /** Signal no more text — TTS will finish current audio and fire onEnd */
  const endStream = useCallback(() => {
    if (ttsCtxRef.current) {
      ttsCtxRef.current.no_more_inputs().catch((e) => {
        if (import.meta.env.DEV) console.warn("[TTS] endStream failed:", e);
      });
      ttsCtxRef.current = null;
    }
  }, []);

  /** Legacy: prepare full text at once (buffered mode). Still used as fallback. */
  const prepare = useCallback(
    async (text: string): Promise<void> => {
      stop();

      try {
        await ensureWs();

        const bufferReady = new Promise<void>((resolve) => {
          const player = new StreamingAudioPlayer({
            sampleRate: SAMPLE_RATE,
            buffered: true,
            onBufferingComplete: () => resolve(),
            onEnd: () => {
              const metrics = player.getMetrics();
              if (metrics) onMetricsRef.current?.(metrics);
              playerRef.current = null;
              onEndRef.current?.();
            },
          });
          playerRef.current = player;

          const ttsCtx = wsRef.current!.context({
            model_id: "sonic-3",
            voice: {
              mode: "id" as const,
              id: configRef.current!.voiceId,
            },
            output_format: {
              container: "raw" as const,
              encoding: "pcm_f32le" as const,
              sample_rate: SAMPLE_RATE,
            },
          });

          // Background receive loop — buffers audio chunks
          const loopWs = wsRef.current;
          const gen = generationRef.current;
          (async () => {
            try {
              for await (const event of ttsCtx.receive()) {
                if (gen !== generationRef.current) break;
                if (event.type === "chunk" && event.audio) {
                  const bytes =
                    event.audio instanceof ArrayBuffer
                      ? new Uint8Array(event.audio)
                      : new Uint8Array(
                          event.audio.buffer,
                          event.audio.byteOffset,
                          event.audio.byteLength,
                        );
                  const float32 = new Float32Array(
                    bytes.buffer.slice(
                      bytes.byteOffset,
                      bytes.byteOffset + bytes.byteLength,
                    ),
                  );
                  player.appendChunk(float32);
                }
              }
            } catch (e) {
              if (import.meta.env.DEV) console.warn("[TTS] receive loop ended:", e);
              if (wsRef.current === loopWs) wsRef.current = null;
            }
            if (gen === generationRef.current) player.markStreamComplete();
          })();

          // Send complete text and signal end of input
          ttsCtx
            .push({ transcript: text })
            .then(() => ttsCtx.no_more_inputs())
            .catch((e) => {
              if (import.meta.env.DEV) console.warn("[TTS] push/no_more_inputs failed:", e);
            });
        });

        await bufferReady;
        setIsReady(true);
      } catch (e) {
        if (import.meta.env.DEV) console.warn("[TTS] Cartesia failed during prepare, will use Web Speech fallback:", e);
        fallbackTextRef.current = text;
        setIsReady(true);
      }
    },
    [stop, ensureWs],
  );

  const play = useCallback(() => {
    if (fallbackTextRef.current) {
      const text = fallbackTextRef.current;
      fallbackTextRef.current = null;
      setIsReady(false);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => onEndRef.current?.();
      utterance.onerror = () => onEndRef.current?.();
      window.speechSynthesis.speak(utterance);
      return;
    }

    if (playerRef.current) {
      setIsReady(false);
      playerRef.current.play();
    }
  }, []);

  return { prepare, play, stop, destroy, isReady, warmup, startStream, pushText, endStream };
}
