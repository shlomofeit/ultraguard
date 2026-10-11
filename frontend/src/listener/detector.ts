export const SNR_THRESHOLD_DB = 15;
export const PEAK_RANGE_DB = 30;
export const ENTROPY_MAX = 0.8;
export const GAP_FRAMES = 5;
export const MIN_FRAMES = 2;
export const MAX_DISTINCT_PEAKS = 8;

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
  return {
    isActive: activeFreqsHz.length > 0,
    peakFreqHz: freqs[peakIndex],
    peakSnrDb: snr[peakIndex],
    entropy: spectralEntropy(levelsDb, floorDb),
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
  let rising = true;
  let falling = true;
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) rising = false;
    if (values[i] > values[i - 1]) falling = false;
  }
  return (rising || falling) && values[0] !== values[values.length - 1];
};

const buildDetection = (state: DetectorState): Detection => {
  const frames = state.activeFrames;
  const peaks = frames.map((frame) => frame.peakFreqHz);
  const distinctPeaks = new Set(peaks).size;
  const freqsHz = [
    ...new Set(frames.flatMap((frame) => frame.activeFreqsHz)),
  ].sort((a, b) => a - b);
  const meanEntropy =
    frames.reduce((sum, frame) => sum + frame.entropy, 0) / frames.length;
  const isStable = distinctPeaks <= MAX_DISTINCT_PEAKS;
  const isSweep = !isStable && isMonotonic(peaks);

  return {
    startMs: state.startFrame * state.frameMs,
    durationMs: frames.length * state.frameMs,
    peakFreqHz: mostCommon(peaks),
    freqsHz,
    maxSnrDb: Math.max(...frames.map((frame) => frame.peakSnrDb)),
    meanEntropy,
    isStable,
    isSweep,
    isBeacon:
      frames.length >= MIN_FRAMES &&
      meanEntropy < ENTROPY_MAX &&
      (isStable || isSweep),
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
