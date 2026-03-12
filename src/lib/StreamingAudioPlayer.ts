import type { ChunkEvent, AudioPipelineMetrics } from "./audioTelemetry";

export interface StreamingAudioPlayerOptions {
  sampleRate: number;
  onEnd?: () => void;
  onBufferingComplete?: () => void;
  buffered?: boolean;
  clock?: { now(): number };
  audioContextFactory?: (opts: AudioContextOptions) => AudioContext;
}

export class StreamingAudioPlayer {
  private ctx: AudioContext;
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private streamComplete = false;
  private onEnd?: () => void;
  private onBufferingComplete?: () => void;
  private buffered: boolean;
  private stopped = false;
  private clock: { now(): number };
  private chunkEvents: ChunkEvent[] = [];
  private lastChunkEndMs = 0;
  private pendingChunks: Float32Array[] = [];
  private bufferingDone = false;

  constructor({
    sampleRate,
    onEnd,
    onBufferingComplete,
    buffered,
    clock,
    audioContextFactory,
  }: StreamingAudioPlayerOptions) {
    this.clock = clock ?? performance;
    const factory = audioContextFactory ?? ((opts) => new AudioContext(opts));
    this.ctx = factory({ sampleRate });
    this.onEnd = onEnd;
    this.onBufferingComplete = onBufferingComplete;
    this.buffered = buffered ?? false;
  }

  async appendChunk(pcm: Float32Array) {
    if (this.stopped) return;

    if (this.buffered) {
      this.pendingChunks.push(pcm);
      const wallNow = this.clock.now();
      const duration = pcm.length / this.ctx.sampleRate;
      this.chunkEvents.push({
        chunkIndex: this.chunkEvents.length,
        wallClockArrivalMs: wallNow,
        scheduledStartSec: 0,
        scheduledEndSec: 0,
        gapSeconds: 0,
        bufferDurationSeconds: duration,
      });
      return;
    }

    // Resume AudioContext if suspended (required after user gesture on mobile)
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    const buffer = this.ctx.createBuffer(1, pcm.length, this.ctx.sampleRate);
    buffer.getChannelData(0).set(pcm);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);

    const now = this.ctx.currentTime;
    const start = Math.max(this.nextStartTime, now);
    const gap = Math.max(0, now - this.nextStartTime);
    source.start(start);
    this.nextStartTime = start + buffer.duration;

    const wallNow = this.clock.now();
    this.chunkEvents.push({
      chunkIndex: this.chunkEvents.length,
      wallClockArrivalMs: wallNow,
      scheduledStartSec: start,
      scheduledEndSec: start + buffer.duration,
      gapSeconds: gap,
      bufferDurationSeconds: buffer.duration,
    });

    if (gap > 0.01 && import.meta.env.DEV) {
      console.warn(
        `[AudioPlayer] Gap detected: ${(gap * 1000).toFixed(1)}ms at chunk ${this.chunkEvents.length - 1}`,
      );
    }

    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source);
      if (this.streamComplete && this.activeSources.length === 0) {
        this.lastChunkEndMs = this.clock.now();
        this.onEnd?.();
      }
    };
  }

  markStreamComplete() {
    if (this.buffered) {
      this.bufferingDone = true;
      this.onBufferingComplete?.();
      return;
    }

    this.streamComplete = true;
    // If no audio was scheduled (or all already finished), fire immediately
    if (this.activeSources.length === 0) {
      this.lastChunkEndMs = this.clock.now();
      this.onEnd?.();
    }
  }

  async play() {
    if (this.stopped || this.pendingChunks.length === 0) {
      this.onEnd?.();
      return;
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    let offset = now;

    for (let i = 0; i < this.pendingChunks.length; i++) {
      const pcm = this.pendingChunks[i];
      const buffer = this.ctx.createBuffer(1, pcm.length, this.ctx.sampleRate);
      buffer.getChannelData(0).set(pcm);

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(offset);

      // Update chunk events with actual schedule times (no gaps since all pre-buffered)
      if (i < this.chunkEvents.length) {
        this.chunkEvents[i].scheduledStartSec = offset;
        this.chunkEvents[i].scheduledEndSec = offset + buffer.duration;
      }

      offset += buffer.duration;
      this.activeSources.push(source);

      source.onended = () => {
        this.activeSources = this.activeSources.filter((s) => s !== source);
        if (this.streamComplete && this.activeSources.length === 0) {
          this.lastChunkEndMs = this.clock.now();
          this.onEnd?.();
        }
      };
    }

    this.pendingChunks = [];
    this.streamComplete = true;
  }

  isBufferingDone(): boolean {
    return this.bufferingDone;
  }

  getMetrics(): AudioPipelineMetrics | null {
    if (this.chunkEvents.length === 0) return null;

    const firstChunkArrivalMs = this.chunkEvents[0].wallClockArrivalMs;
    const lastChunkEndMs = this.lastChunkEndMs || this.clock.now();
    const totalAudioDurationSeconds = this.chunkEvents.reduce(
      (sum, e) => sum + e.bufferDurationSeconds,
      0,
    );
    const totalGapSeconds = this.chunkEvents.reduce(
      (sum, e) => sum + e.gapSeconds,
      0,
    );
    const gapCount = this.chunkEvents.filter((e) => e.gapSeconds > 0).length;
    const maxGapSeconds = Math.max(...this.chunkEvents.map((e) => e.gapSeconds));

    return {
      firstChunkArrivalMs,
      lastChunkEndMs,
      totalAudioDurationSeconds,
      totalWallClockMs: lastChunkEndMs - firstChunkArrivalMs,
      totalGapSeconds,
      gapCount,
      maxGapSeconds,
      chunks: [...this.chunkEvents],
    };
  }

  stop() {
    this.stopped = true;
    this.pendingChunks = [];
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
    }
    this.activeSources = [];
    this.ctx.close().catch(() => {});
  }
}
