import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  StreamingAudioPlayer,
  type StreamingAudioPlayerOptions,
} from "../../lib/StreamingAudioPlayer";

// --- Mock AudioContext infrastructure ---

class MockAudioBufferSourceNode {
  buffer: { duration: number } | null = null;
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  sampleRate: number;
  currentTime = 0;
  state: AudioContextState = "running";
  destination = {};

  private sources: MockAudioBufferSourceNode[] = [];

  constructor(opts?: AudioContextOptions) {
    this.sampleRate = opts?.sampleRate ?? 44100;
  }

  createBufferSource() {
    const source = new MockAudioBufferSourceNode();
    this.sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }

  createBuffer(_channels: number, length: number, sampleRate: number) {
    return {
      duration: length / sampleRate,
      getChannelData: () => new Float32Array(length),
    } as unknown as AudioBuffer;
  }

  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);

  /** Test helper: fire onended for all sources */
  flushSources() {
    for (const s of this.sources) {
      s.onended?.();
    }
    this.sources = [];
  }

  /** Test helper: get pending sources */
  getPendingSources() {
    return [...this.sources];
  }
}

function createTestPlayer(
  overrides: Partial<StreamingAudioPlayerOptions> = {},
) {
  let clockMs = 0;
  const clock = { now: () => clockMs, advance: (ms: number) => (clockMs += ms) };
  const ctx = new MockAudioContext({ sampleRate: 44100 });
  const onEnd = vi.fn();

  const player = new StreamingAudioPlayer({
    sampleRate: 44100,
    onEnd,
    clock,
    audioContextFactory: (opts) => {
      ctx.sampleRate = opts.sampleRate ?? 44100;
      return ctx as unknown as AudioContext;
    },
    ...overrides,
  });

  return { player, ctx, clock, onEnd };
}

function makePcm(samples = 4410): Float32Array {
  return new Float32Array(samples); // 0.1s at 44100 Hz
}

describe("StreamingAudioPlayer", () => {
  // Suppress import.meta.env.DEV console warnings in tests
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("zero-gap playback", () => {
    test("10 chunks arriving faster than playback reports no gaps", async () => {
      const { player } = createTestPlayer();
      // currentTime stays at 0 — chunks arrive instantly before any playback
      for (let i = 0; i < 10; i++) {
        await player.appendChunk(makePcm());
      }

      const metrics = player.getMetrics();
      expect(metrics).not.toBeNull();
      expect(metrics!.gapCount).toBe(0);
      expect(metrics!.totalGapSeconds).toBe(0);
      expect(metrics!.chunks).toHaveLength(10);
    });
  });

  describe("gap detection", () => {
    test("detects gap when currentTime advances past nextStartTime", async () => {
      const { player, ctx } = createTestPlayer();

      // First chunk: 0.1s of audio at 44100 Hz
      await player.appendChunk(makePcm());
      // Simulate time passing beyond scheduled end (0.1s + gap)
      ctx.currentTime = 0.3; // 0.2s gap
      await player.appendChunk(makePcm());

      const metrics = player.getMetrics();
      expect(metrics!.gapCount).toBe(1);
      expect(metrics!.totalGapSeconds).toBeCloseTo(0.2, 2);
      expect(metrics!.maxGapSeconds).toBeCloseTo(0.2, 2);
    });

    test("gap value is zero when chunk arrives before scheduled time", async () => {
      const { player } = createTestPlayer();
      await player.appendChunk(makePcm());
      // Don't advance currentTime — next chunk arrives before first finishes
      await player.appendChunk(makePcm());

      const metrics = player.getMetrics();
      expect(metrics!.chunks[1].gapSeconds).toBe(0);
    });
  });

  describe("bursty arrival", () => {
    test("5 fast chunks, pause, 5 fast chunks → exactly 1 gap", async () => {
      const { player, ctx } = createTestPlayer();

      // First burst: 5 chunks at currentTime=0
      for (let i = 0; i < 5; i++) {
        await player.appendChunk(makePcm());
      }
      // 5 chunks × 0.1s = 0.5s scheduled. Advance past that.
      ctx.currentTime = 1.0; // 0.5s gap

      // Second burst: 5 more chunks
      for (let i = 0; i < 5; i++) {
        await player.appendChunk(makePcm());
      }

      const metrics = player.getMetrics();
      expect(metrics!.chunks).toHaveLength(10);
      expect(metrics!.gapCount).toBe(1);
      expect(metrics!.totalGapSeconds).toBeCloseTo(0.5, 2);
    });
  });

  describe("metrics accuracy", () => {
    test("firstChunkArrivalMs and totalAudioDurationSeconds are correct", async () => {
      const { player, clock } = createTestPlayer();

      clock.advance(100);
      await player.appendChunk(makePcm()); // 0.1s
      clock.advance(50);
      await player.appendChunk(makePcm()); // 0.1s
      clock.advance(50);
      await player.appendChunk(makePcm()); // 0.1s

      const metrics = player.getMetrics();
      expect(metrics!.firstChunkArrivalMs).toBe(100);
      expect(metrics!.totalAudioDurationSeconds).toBeCloseTo(0.3, 3);
      expect(metrics!.chunks).toHaveLength(3);
    });

    test("lastChunkEndMs is set after markStreamComplete + onended", async () => {
      const { player, ctx, clock, onEnd } = createTestPlayer();

      await player.appendChunk(makePcm());
      clock.advance(200);
      player.markStreamComplete();
      // Simulate all sources finishing
      ctx.flushSources();

      expect(onEnd).toHaveBeenCalled();
      const metrics = player.getMetrics();
      expect(metrics!.lastChunkEndMs).toBe(200);
    });
  });

  describe("lifecycle", () => {
    test("stop prevents further chunk processing", async () => {
      const { player } = createTestPlayer();

      await player.appendChunk(makePcm());
      player.stop();
      await player.appendChunk(makePcm());

      const metrics = player.getMetrics();
      expect(metrics!.chunks).toHaveLength(1);
    });

    test("markStreamComplete fires onEnd immediately when no sources", () => {
      const { player, onEnd } = createTestPlayer();
      player.markStreamComplete();
      expect(onEnd).toHaveBeenCalled();
    });

    test("onEnd fires after last source ends when stream is complete", async () => {
      const { player, ctx, onEnd } = createTestPlayer();

      await player.appendChunk(makePcm());
      player.markStreamComplete();
      expect(onEnd).not.toHaveBeenCalled();

      ctx.flushSources();
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    test("resumes suspended context", async () => {
      const { player, ctx } = createTestPlayer();
      ctx.state = "suspended" as AudioContextState;

      await player.appendChunk(makePcm());
      expect(ctx.resume).toHaveBeenCalled();
    });
  });

  describe("getMetrics", () => {
    test("returns null when no chunks appended", () => {
      const { player } = createTestPlayer();
      expect(player.getMetrics()).toBeNull();
    });

    test("returns defensive copy of chunks", async () => {
      const { player } = createTestPlayer();
      await player.appendChunk(makePcm());

      const m1 = player.getMetrics();
      const m2 = player.getMetrics();
      expect(m1!.chunks).not.toBe(m2!.chunks);
      expect(m1!.chunks).toEqual(m2!.chunks);
    });
  });

  describe("buffered mode", () => {
    test("appendChunk stores chunks without scheduling playback", async () => {
      const { player, ctx } = createTestPlayer({ buffered: true });

      await player.appendChunk(makePcm());
      await player.appendChunk(makePcm());

      // No sources should be created in buffered mode
      expect(ctx.getPendingSources()).toHaveLength(0);
      // But metrics should track chunks
      const metrics = player.getMetrics();
      expect(metrics!.chunks).toHaveLength(2);
      expect(metrics!.totalAudioDurationSeconds).toBeCloseTo(0.2, 3);
    });

    test("markStreamComplete fires onBufferingComplete instead of onEnd", async () => {
      const onBufferingComplete = vi.fn();
      const { player, onEnd } = createTestPlayer({
        buffered: true,
        onBufferingComplete,
      });

      await player.appendChunk(makePcm());
      player.markStreamComplete();

      expect(onBufferingComplete).toHaveBeenCalledTimes(1);
      expect(onEnd).not.toHaveBeenCalled();
      expect(player.isBufferingDone()).toBe(true);
    });

    test("play() schedules all buffered chunks gaplessly", async () => {
      const { player, ctx, onEnd } = createTestPlayer({ buffered: true });

      await player.appendChunk(makePcm());
      await player.appendChunk(makePcm());
      await player.appendChunk(makePcm());
      player.markStreamComplete();

      await player.play();

      // All 3 sources should now be created and scheduled
      const sources = ctx.getPendingSources();
      expect(sources).toHaveLength(3);
      // All sources should have start() called
      for (const source of sources) {
        expect(source.start).toHaveBeenCalled();
      }

      // Metrics should show zero gaps (all pre-buffered)
      const metrics = player.getMetrics();
      expect(metrics!.chunks).toHaveLength(3);
      expect(metrics!.gapCount).toBe(0);

      // Simulate playback completing
      ctx.flushSources();
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    test("play() fires onEnd immediately when no chunks buffered", async () => {
      const { player, onEnd } = createTestPlayer({ buffered: true });

      await player.play();
      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    test("stop clears pending chunks", async () => {
      const { player } = createTestPlayer({ buffered: true });

      await player.appendChunk(makePcm());
      await player.appendChunk(makePcm());
      player.stop();

      // Can't play after stop, but we can verify state was cleared
      const metrics = player.getMetrics();
      expect(metrics!.chunks).toHaveLength(2); // events still recorded
      // But the player is stopped, so further operations are no-ops
      await player.appendChunk(makePcm());
      expect(player.getMetrics()!.chunks).toHaveLength(2); // no new chunk
    });

    test("play() resumes suspended context", async () => {
      const { player, ctx } = createTestPlayer({ buffered: true });

      await player.appendChunk(makePcm());
      player.markStreamComplete();

      ctx.state = "suspended" as AudioContextState;
      await player.play();
      expect(ctx.resume).toHaveBeenCalled();
    });
  });
});
