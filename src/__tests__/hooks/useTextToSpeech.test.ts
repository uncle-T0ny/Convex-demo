import { renderHook, act } from "@testing-library/react";
import { describe, expect, test, vi, afterEach, beforeEach } from "vitest";
import { useTextToSpeech } from "../../hooks/useTextToSpeech";

const mockSynthesize = vi.fn();

vi.mock("convex/react", () => ({
  useAction: () => mockSynthesize,
}));

interface MockUtterance {
  text: string;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

let lastUtterance: MockUtterance | null = null;

interface MockAudio {
  src: string;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
}

let lastAudio: MockAudio | null = null;

function installMocks() {
  lastUtterance = null;
  lastAudio = null;

  Object.defineProperty(window, "speechSynthesis", {
    value: {
      cancel: vi.fn(),
      speak: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "SpeechSynthesisUtterance", {
    value: function MockUtteranceConstructor(text: string) {
      const utterance: MockUtterance = {
        text,
        onend: null,
        onerror: null,
      };
      lastUtterance = utterance;
      return utterance;
    },
    writable: true,
    configurable: true,
  });

  // Mock Audio constructor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Audio = function MockAudioConstructor() {
    const audio: MockAudio = {
      src: "",
      onended: null,
      onerror: null,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    };
    lastAudio = audio;
    return audio;
  };

  // Mock URL.createObjectURL / revokeObjectURL
  globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
  globalThis.URL.revokeObjectURL = vi.fn();
}

function removeMocks() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).speechSynthesis;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).SpeechSynthesisUtterance;
  lastUtterance = null;
  lastAudio = null;
}

describe("useTextToSpeech", () => {
  beforeEach(() => {
    installMocks();
    mockSynthesize.mockReset();
  });

  afterEach(() => {
    removeMocks();
  });

  test("speak calls Cartesia via synthesize action", async () => {
    mockSynthesize.mockResolvedValue(new Uint8Array([1, 2, 3]));
    const { result } = renderHook(() => useTextToSpeech({}));
    await act(async () => {
      await result.current.speak("Hello");
    });
    expect(mockSynthesize).toHaveBeenCalledWith({ text: "Hello" });
    expect(lastAudio?.play).toHaveBeenCalled();
  });

  test("onEnd called when audio finishes", async () => {
    mockSynthesize.mockResolvedValue(new Uint8Array([1, 2, 3]));
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTextToSpeech({ onEnd }));
    await act(async () => {
      await result.current.speak("Hello");
    });
    act(() => lastAudio!.onended!());
    expect(onEnd).toHaveBeenCalled();
  });

  test("onEnd called on audio error", async () => {
    mockSynthesize.mockResolvedValue(new Uint8Array([1, 2, 3]));
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTextToSpeech({ onEnd }));
    await act(async () => {
      await result.current.speak("Hello");
    });
    act(() => lastAudio!.onerror!());
    expect(onEnd).toHaveBeenCalled();
  });

  test("falls back to Web Speech API when Cartesia fails", async () => {
    mockSynthesize.mockRejectedValue(new Error("API error"));
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTextToSpeech({ onEnd }));
    await act(async () => {
      await result.current.speak("Hello");
    });
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(lastUtterance?.text).toBe("Hello");
  });

  test("fallback onEnd called when utterance finishes", async () => {
    mockSynthesize.mockRejectedValue(new Error("API error"));
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTextToSpeech({ onEnd }));
    await act(async () => {
      await result.current.speak("Hello");
    });
    act(() => lastUtterance!.onend!());
    expect(onEnd).toHaveBeenCalled();
  });

  test("stop pauses audio and cancels speechSynthesis", async () => {
    mockSynthesize.mockResolvedValue(new Uint8Array([1, 2, 3]));
    const { result } = renderHook(() => useTextToSpeech({}));
    await act(async () => {
      await result.current.speak("Hello");
    });
    const audio = lastAudio;
    act(() => result.current.stop());
    expect(audio?.pause).toHaveBeenCalled();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  test("stop is safe when speechSynthesis undefined", () => {
    removeMocks();
    const { result } = renderHook(() => useTextToSpeech({}));
    expect(() => {
      act(() => result.current.stop());
    }).not.toThrow();
  });

  test("revokes previous blob URL on new speak", async () => {
    mockSynthesize.mockResolvedValue(new Uint8Array([1, 2, 3]));
    const { result } = renderHook(() => useTextToSpeech({}));
    await act(async () => {
      await result.current.speak("First");
    });
    await act(async () => {
      await result.current.speak("Second");
    });
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
