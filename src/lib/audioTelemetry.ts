export interface ChunkEvent {
  chunkIndex: number;
  wallClockArrivalMs: number;
  scheduledStartSec: number;
  scheduledEndSec: number;
  gapSeconds: number;
  bufferDurationSeconds: number;
}

export interface AudioPipelineMetrics {
  firstChunkArrivalMs: number;
  lastChunkEndMs: number;
  totalAudioDurationSeconds: number;
  totalWallClockMs: number;
  totalGapSeconds: number;
  gapCount: number;
  maxGapSeconds: number;
  chunks: ChunkEvent[];
}

export interface PipelineTimings {
  userMessageSentMs: number;
  firstAudioChunkMs: number;
  lastAudioEndMs: number;
  audioMetrics: AudioPipelineMetrics;
  timeToFirstAudioMs: number;
  totalLatencyMs: number;
}
