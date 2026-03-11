import { renderHook, act } from "@testing-library/react";
import { describe, expect, test, vi, afterEach, beforeEach } from "vitest";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";

interface MockInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

let lastInstance: MockInstance | null = null;

function createMockConstructor() {
  return function MockSpeechRecognition() {
    const instance: MockInstance = {
      lang: "",
      interimResults: false,
      continuous: false,
      onresult: null,
      onend: null,
      onerror: null,
      start: vi.fn(),
      stop: vi.fn(),
    };
    lastInstance = instance;
    return instance;
  };
}

function installMock(key: "SpeechRecognition" | "webkitSpeechRecognition") {
  lastInstance = null;
  Object.defineProperty(window, key, {
    value: createMockConstructor(),
    writable: true,
    configurable: true,
  });
}

function removeMocks() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).SpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).webkitSpeechRecognition;
  lastInstance = null;
}

describe("useSpeechRecognition", () => {
  afterEach(() => {
    removeMocks();
  });

  describe("isSupported", () => {
    test("true when SpeechRecognition exists", () => {
      installMock("SpeechRecognition");
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult: vi.fn() }),
      );
      expect(result.current.isSupported).toBe(true);
    });

    test("true when webkitSpeechRecognition exists", () => {
      installMock("webkitSpeechRecognition");
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult: vi.fn() }),
      );
      expect(result.current.isSupported).toBe(true);
    });

    test("false when neither exists", () => {
      removeMocks();
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult: vi.fn() }),
      );
      expect(result.current.isSupported).toBe(false);
    });
  });

  describe("start", () => {
    beforeEach(() => {
      installMock("SpeechRecognition");
    });

    test("creates instance and calls start", () => {
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult: vi.fn() }),
      );
      act(() => result.current.start());
      expect(lastInstance).not.toBeNull();
      expect(lastInstance!.start).toHaveBeenCalled();
    });

    test("configures lang, interimResults, continuous", () => {
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult: vi.fn() }),
      );
      act(() => result.current.start());
      expect(lastInstance!.lang).toBe("en-US");
      expect(lastInstance!.interimResults).toBe(false);
      expect(lastInstance!.continuous).toBe(false);
    });

    test("is no-op when not supported", () => {
      removeMocks();
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult: vi.fn() }),
      );
      act(() => result.current.start());
      expect(lastInstance).toBeNull();
    });
  });

  describe("events", () => {
    beforeEach(() => {
      installMock("SpeechRecognition");
    });

    test("onResult called with transcript", () => {
      const onResult = vi.fn();
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult }),
      );
      act(() => result.current.start());
      act(() => {
        lastInstance!.onresult!({
          results: [[{ transcript: "Hello world" }]],
        });
      });
      expect(onResult).toHaveBeenCalledWith("Hello world");
    });

    test("onEnd called when recognition ends", () => {
      const onEnd = vi.fn();
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult: vi.fn(), onEnd }),
      );
      act(() => result.current.start());
      act(() => lastInstance!.onend!());
      expect(onEnd).toHaveBeenCalled();
    });

    test("onEnd called on error", () => {
      const onEnd = vi.fn();
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult: vi.fn(), onEnd }),
      );
      act(() => result.current.start());
      act(() => lastInstance!.onerror!());
      expect(onEnd).toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    test("calls stop on active instance", () => {
      installMock("SpeechRecognition");
      const { result } = renderHook(() =>
        useSpeechRecognition({ onResult: vi.fn() }),
      );
      act(() => result.current.start());
      act(() => result.current.stop());
      expect(lastInstance!.stop).toHaveBeenCalled();
    });
  });
});
