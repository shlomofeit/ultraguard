export const SNR_THRESHOLD_DB = 15;
export const PEAK_RANGE_DB = 30;
export const ENTROPY_MAX = 0.8;
export const GAP_FRAMES = 5;
export const MIN_FRAMES = 2;
export const MAX_DISTINCT_PEAKS = 8;
export const MAX_FRAME_FREQS = 10;
export const MAX_BEACON_FREQS = 12;
export const MIN_BEACON_MS = 150;
export const PROMINENCE_DB = 12;

export const MAIN_PEAK_SHARE = 0.1;
export const SWEEP_SHARE = 0.8;
export const MIN_FREQ_FRAMES = 2;
export const MIN_SWEEP_PEAKS = 3;

export interface FrameResult {
  isActive: boolean;
  peakFreqHz: number;
  peakSnrDb: number;
  entropy: number;
  activeFreqsHz: number[];
}

export interface Detection {
  startMs: number;
  durationMs: number;
  peakFreqHz: number;
  freqsHz: number[];
  maxSnrDb: number;
  meanEntropy: number;
  isStable: boolean;
  isSweep: boolean;
  isBeacon: boolean;
  mainPeaksHz: number[];
  meanFrameFreqs: number;
  switchRate: number;
}

export interface DetectorState {
  frameMs: number;
  frameIndex: number;
  activeFrames: FrameResult[];
  startFrame: number;
  silentFrames: number;
}

const dbToPower = (db: number): number => Math.pow(10, db / 10);

export const spectralEntropy = (
  levelsDb: number[],
  floorDb: number[],
): number => {
  const excess = levelsDb.map((level, band) =>
    Math.max(0, dbToPower(level) - dbToPower(floorDb[band])),
  );
  const total = excess.reduce((sum, value) => sum + value, 0);
  if (total === 0 || excess.length < 2) {
    return 1;
  }
  let entropy = 0;
  for (const value of excess) {
    if (value > 0) {
      const p = value / total;
      entropy -= p * Math.log(p);
    }
  }
  return entropy / Math.log(excess.length);
};

export const isSharpPeak = (snr: number[], band: number): boolean => {
  const neighbors = [snr[band - 1], snr[band + 1]].filter(
    (value) => value !== undefined,
  );
  return (
    snr[band] >= SNR_THRESHOLD_DB &&
    snr[band] - Math.min(...neighbors) >= PROMINENCE_DB
  );
};

export const analyzeFrame = (
  levelsDb: number[],
  floorDb: number[],
  freqs: number[],
): FrameResult => {
  const snr = levelsDb.map((level, band) => level - floorDb[band]);
  const peakIndex = snr.indexOf(Math.max(...snr));
  const peakLevel = Math.max(...levelsDb);
  const activeFreqsHz = freqs.filter(
    (_, band) =>
      snr[band] >= SNR_THRESHOLD_DB &&
      levelsDb[band] >= peakLevel - PEAK_RANGE_DB,
  );
  const entropy = spectralEntropy(levelsDb, floorDb);
  const isTonal =
    activeFreqsHz.length <= MAX_FRAME_FREQS && entropy < ENTROPY_MAX;
  const hasSharpPeak = snr.some((_, band) => isSharpPeak(snr, band));
  return {
    isActive: activeFreqsHz.length > 0 && isTonal && hasSharpPeak,
    peakFreqHz: freqs[peakIndex],
    peakSnrDb: snr[peakIndex],
    entropy,
    activeFreqsHz,
  };
};

export const createDetector = (frameMs: number): DetectorState => {
  return {
    frameMs,
    frameIndex: 0,
    activeFrames: [],
    startFrame: 0,
    silentFrames: 0,
  };
};

const mostCommon = (values: number[]): number => {
  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let best = values[0];
  for (const [value, count] of counts) {
    if (count > (counts.get(best) ?? 0)) {
      best = value;
    }
  }
  return best;
};

const isMonotonic = (values: number[]): boolean => {
  let rising = 0;
  let falling = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) rising++;
    if (values[i] < values[i - 1]) falling++;
  }
  const steps = rising + falling;
  if (
    new Set(values).size < MIN_SWEEP_PEAKS ||
    values[0] === values[values.length - 1]
  ) {
    return false;
  }
  return rising / steps >= SWEEP_SHARE || falling / steps >= SWEEP_SHARE;
};

const getRepeatedFreqs = (frames: FrameResult[]): number[] => {
  const counts = new Map<number, number>();
  for (const frame of frames) {
    for (const freq of frame.activeFreqsHz) {
      counts.set(freq, (counts.get(freq) ?? 0) + 1);
    }
  }
  const minCount = frames.length >= 3 ? MIN_FREQ_FRAMES : 1;
  return [...counts]
    .filter(([, count]) => count >= minCount)
    .map(([freq]) => freq)
    .sort((a, b) => a - b);
};

const getMainPeaks = (peaks: number[]): number[] => {
  const counts = new Map<number, number>();
  for (const peak of peaks) {
    counts.set(peak, (counts.get(peak) ?? 0) + 1);
  }
  const minCount = Math.max(2, peaks.length * MAIN_PEAK_SHARE);
  return [...counts]
    .filter(([, count]) => count >= minCount)
    .map(([peak]) => peak)
    .sort((a, b) => a - b);
};

const getSwitchRate = (peaks: number[]): number => {
  if (peaks.length < 2) {
    return 0;
  }
  let switches = 0;
  for (let i = 1; i < peaks.length; i++) {
    if (peaks[i] !== peaks[i - 1]) {
      switches++;
    }
  }
  return switches / (peaks.length - 1);
};

const buildDetection = (state: DetectorState): Detection => {
  const frames = state.activeFrames;
  const peaks = frames.map((frame) => frame.peakFreqHz);
  const distinctPeaks = new Set(peaks).size;
  const freqsHz = getRepeatedFreqs(frames);
  const meanEntropy =
    frames.reduce((sum, frame) => sum + frame.entropy, 0) / frames.length;
  const isStable = distinctPeaks <= MAX_DISTINCT_PEAKS;
  const isSweep = isMonotonic(peaks);
  const durationMs = frames.length * state.frameMs;
  const meanFrameFreqs =
    frames.reduce((sum, frame) => sum + frame.activeFreqsHz.length, 0) /
    frames.length;

  return {
    startMs: state.startFrame * state.frameMs,
    durationMs,
    peakFreqHz: mostCommon(peaks),
    freqsHz,
    maxSnrDb: Math.max(...frames.map((frame) => frame.peakSnrDb)),
    meanEntropy,
    isStable,
    isSweep,
    isBeacon:
      frames.length >= MIN_FRAMES &&
      durationMs >= MIN_BEACON_MS &&
      freqsHz.length <= MAX_BEACON_FREQS &&
      meanEntropy < ENTROPY_MAX &&
      (isStable || isSweep),
    mainPeaksHz: getMainPeaks(peaks),
    meanFrameFreqs,
    switchRate: getSwitchRate(peaks),
  };
};

export const pushFrame = (
  state: DetectorState,
  frame: FrameResult,
): Detection | null => {
  const index = state.frameIndex;
  state.frameIndex++;

  if (frame.isActive) {
    if (state.activeFrames.length === 0) {
      state.startFrame = index;
    }
    state.activeFrames.push(frame);
    state.silentFrames = 0;
    return null;
  }

  if (state.activeFrames.length === 0) {
    return null;
  }

  state.silentFrames++;
  if (state.silentFrames < GAP_FRAMES) {
    return null;
  }

  const detection = buildDetection(state);
  state.activeFrames = [];
  state.silentFrames = 0;
  return detection;
};
