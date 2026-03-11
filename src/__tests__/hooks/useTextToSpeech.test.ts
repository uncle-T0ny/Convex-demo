import { renderHook, act } from "@testing-library/react";
import { describe, expect, test, vi, afterEach, beforeEach } from "vitest";
import { useTextToSpeech } from "../../hooks/useTextToSpeech";

interface MockUtterance {
  text: string;
  rate: number;
  pitch: number;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

let lastUtterance: MockUtterance | null = null;

function installMocks() {
  lastUtterance = null;
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
        rate: 0,
        pitch: 0,
        onend: null,
        onerror: null,
      };
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
  lastUtterance = null;
}

describe("useTextToSpeech", () => {
  beforeEach(() => {
    installMocks();
  });

  afterEach(() => {
    removeMocks();
  });

  test("speak cancels ongoing speech first", () => {
    const { result } = renderHook(() => useTextToSpeech({}));
    act(() => result.current.speak("Hello"));
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  test("speak creates utterance with text", () => {
    const { result } = renderHook(() => useTextToSpeech({}));
    act(() => result.current.speak("Hello"));
    expect(lastUtterance?.text).toBe("Hello");
  });

  test("speak calls speechSynthesis.speak", () => {
    const { result } = renderHook(() => useTextToSpeech({}));
    act(() => result.current.speak("Hello"));
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  test("speak sets rate=1 and pitch=1", () => {
    const { result } = renderHook(() => useTextToSpeech({}));
    act(() => result.current.speak("Hello"));
    expect(lastUtterance?.rate).toBe(1);
    expect(lastUtterance?.pitch).toBe(1);
  });

  test("speak is no-op without speechSynthesis", () => {
    removeMocks();
    const { result } = renderHook(() => useTextToSpeech({}));
    expect(() => {
      act(() => result.current.speak("Hello"));
    }).not.toThrow();
    expect(lastUtterance).toBeNull();
  });

  test("onEnd called when utterance finishes", () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTextToSpeech({ onEnd }));
    act(() => result.current.speak("Hello"));
    act(() => lastUtterance!.onend!());
    expect(onEnd).toHaveBeenCalled();
  });

  test("onEnd called on utterance error", () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useTextToSpeech({ onEnd }));
    act(() => result.current.speak("Hello"));
    act(() => lastUtterance!.onerror!());
    expect(onEnd).toHaveBeenCalled();
  });

  test("stop calls speechSynthesis.cancel", () => {
    const { result } = renderHook(() => useTextToSpeech({}));
    act(() => result.current.stop());
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  test("stop is safe when speechSynthesis undefined", () => {
    removeMocks();
    const { result } = renderHook(() => useTextToSpeech({}));
    expect(() => {
      act(() => result.current.stop());
    }).not.toThrow();
  });
});
