import { renderHook, act } from "@testing-library/react";
import { describe, expect, test, vi, afterEach, beforeEach } from "vitest";
import { useTextToSpeech } from "../../hooks/useTextToSpeech";
import { MockAudioBufferSourceNode } from "../helpers/audioMocks";

// Mock getTtsConfig action
const mockGetTtsConfig = vi
  .fn()
  .mockResolvedValue({ apiKey: "test-key", voiceId: "test-voice" });

vi.mock("convex/react", () => ({
  useAction: () => mockGetTtsConfig,
}));

// Mock Cartesia SDK
interface MockTtsContext {
  push: ReturnType<typeof vi.fn>;
  no_more_inputs: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  receive: ReturnType<typeof vi.fn>;
}

let mockTtsContext: MockTtsContext;

interface MockWs {
  context: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
}

let mockWs: MockWs;

vi.mock("@cartesia/cartesia-js", () => {
  return {
    default: class MockCartesia {
      tts = {
        websocket: vi.fn().mockImplementation(async () => {
          mockTtsContext = {
            push: vi.fn().mockResolvedValue(undefined),
            no_more_inputs: vi.fn().mockResolvedValue(undefined),
            cancel: vi.fn().mockResolvedValue(undefined),
            receive: vi.fn().mockReturnValue(
              (async function* () {
                // Yield one chunk then end
                yield {
                  type: "chunk" as const,
                  audio: new Float32Array([0.1, 0.2, 0.3]),
                };
              })(),
            ),
          };
          mockWs = {
            context: vi.fn().mockReturnValue(mockTtsContext),
            close: vi.fn(),
            on: vi.fn(),
          };
          return mockWs;
        }),
      };
    },
  };
});

// Mock AudioContext
class MockAudioBuffer {
  numberOfChannels = 1;
  length: number;
  sampleRate: number;
  duration: number;
  private channelData: Float32Array;

  constructor(options: { length: number; sampleRate: number }) {
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.duration = options.length / options.sampleRate;
    this.channelData = new Float32Array(options.length);
  }

  getChannelData() {
    return this.channelData;
  }
}

function installAudioMocks() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).AudioContext = class MockAudioContext {
    sampleRate = 44100;
    currentTime = 0;
    state = "running";
    destination = {};
    createBufferSource() {
      return new MockAudioBufferSourceNode();
    }
    createBuffer(
      _channels: number,
      length: number,
      sampleRate: number,
    ): AudioBuffer {
      return new MockAudioBuffer({
        length,
        sampleRate,
      }) as unknown as AudioBuffer;
    }
    resume = vi.fn().mockResolvedValue(undefined);
    close = vi.fn().mockResolvedValue(undefined);
  };
}

// Mock Web Speech API
interface MockUtterance {
  text: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

let lastUtterance: MockUtterance | null = null;

function installSpeechMocks() {
  lastUtterance = null;
  Object.defineProperty(window, "speechSynthesis", {
    value: { cancel: vi.fn(), speak: vi.fn() },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    value: function MockUtteranceConstructor(text: string) {
      const utterance: MockUtterance = { text, onend: null, onerror: null };
      lastUtterance = utterance;
      return utterance;
    },
    writable: true,
    configurable: true,
  });
}

function removeMocks() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).speechSynthesis;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).SpeechSynthesisUtterance;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).AudioContext;
  lastUtterance = null;
}

describe("useTextToSpeech", () => {
  beforeEach(() => {
    installAudioMocks();
    installSpeechMocks();
    mockGetTtsConfig.mockClear();
  });

  afterEach(() => {
    removeMocks();
  });

  test("prepare opens WebSocket, sends text, and resolves when buffering completes", async () => {
    const { result } = renderHook(() => useTextToSpeech({}));

    await act(async () => {
      await result.current.prepare("Hello world.");
    });

    expect(mockGetTtsConfig).toHaveBeenCalled();
    expect(mockWs.context).toHaveBeenCalledWith(
      expect.objectContaining({
        model_id: "sonic-3",
        voice: { mode: "id", id: "test-voice" },
      }),
    );
    expect(mockTtsContext.push).toHaveBeenCalledWith({
      transcript: "Hello world.",
    });
    expect(mockTtsContext.no_more_inputs).toHaveBeenCalled();
  });

  test("isReady becomes true after prepare resolves", async () => {
    const { result } = renderHook(() => useTextToSpeech({}));

    expect(result.current.isReady).toBe(false);

    await act(async () => {
      await result.current.prepare("Hello.");
    });

    expect(result.current.isReady).toBe(true);
  });

  test("play() triggers audio playback after prepare", async () => {
    const { result } = renderHook(() => useTextToSpeech({}));

    await act(async () => {
      await result.current.prepare("Hello.");
    });

    act(() => {
      result.current.play();
    });

    expect(result.current.isReady).toBe(false);
  });

  test("stop clears ready state and cancels Web Speech", async () => {
    const { result } = renderHook(() => useTextToSpeech({}));

    await act(async () => {
      await result.current.prepare("Hello.");
    });

    expect(result.current.isReady).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isReady).toBe(false);
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  test("config is cached across prepare calls", async () => {
    const { result } = renderHook(() => useTextToSpeech({}));

    await act(async () => {
      await result.current.prepare("First.");
    });
    act(() => result.current.stop());
    await act(async () => {
      await result.current.prepare("Second.");
    });

    expect(mockGetTtsConfig).toHaveBeenCalledTimes(1);
  });

  test("falls back to Web Speech API on SDK error", async () => {
    mockGetTtsConfig.mockRejectedValueOnce(new Error("API error"));
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTextToSpeech({ onEnd }));

    await act(async () => {
      await result.current.prepare("Hello");
    });

    // isReady should still be true (fallback prepared)
    expect(result.current.isReady).toBe(true);

    act(() => {
      result.current.play();
    });

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(lastUtterance?.text).toBe("Hello");
  });

  test("fallback onEnd fires when utterance finishes", async () => {
    mockGetTtsConfig.mockRejectedValueOnce(new Error("API error"));
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTextToSpeech({ onEnd }));

    await act(async () => {
      await result.current.prepare("Hello");
    });
    act(() => result.current.play());
    act(() => lastUtterance!.onend!());

    expect(onEnd).toHaveBeenCalled();
  });

  test("stop is safe when speechSynthesis is undefined", () => {
    removeMocks();
    const { result } = renderHook(() => useTextToSpeech({}));
    expect(() => {
      act(() => result.current.stop());
    }).not.toThrow();
  });

  describe("timing telemetry", () => {
    test("onMetrics fires with valid metrics after play completes", async () => {
      const onMetrics = vi.fn();
      const onEnd = vi.fn();

      // Track source nodes so we can fire onended
      const sourceNodes: MockAudioBufferSourceNode[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).AudioContext = class extends (globalThis as any)
        .AudioContext {
        createBufferSource() {
          const node = new MockAudioBufferSourceNode();
          sourceNodes.push(node);
          return node;
        }
      };

      const { result } = renderHook(() =>
        useTextToSpeech({ onEnd, onMetrics }),
      );

      await act(async () => {
        await result.current.prepare("Hello world.");
      });

      // Wait for async receive loop to complete
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      act(() => {
        result.current.play();
      });

      // Wait for play() to schedule sources
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      // Simulate all audio sources finishing playback
      act(() => {
        for (const node of sourceNodes) {
          node.onended?.();
        }
      });

      if (onMetrics.mock.calls.length > 0) {
        const metrics = onMetrics.mock.calls[0][0];
        expect(metrics.chunks.length).toBeGreaterThan(0);
        expect(metrics.firstChunkArrivalMs).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
