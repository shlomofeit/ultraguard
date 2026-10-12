export const FRAME_SIZE = 1024;
export const GRID_FROM_HZ = 16000;
export const GRID_STEP_HZ = 250;
export const NYQUIST_MARGIN_HZ = 500;
export const NOISE_HISTORY = 50;
export const MIN_DB = -200;

export const makeFreqGrid = (sampleRate: number): number[] => {
  const maxHz = sampleRate / 2 - NYQUIST_MARGIN_HZ;
  const freqs: number[] = [];
  for (let freq = GRID_FROM_HZ; freq <= maxHz; freq += GRID_STEP_HZ) {
    freqs.push(freq);
  }
  return freqs;
};

export const applyHann = (frame: Float32Array): Float32Array => {
  const length = frame.length;
  const windowed = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const weight = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (length - 1));
    windowed[i] = frame[i] * weight;
  }
  return windowed;
};

export const goertzelPower = (
  frame: Float32Array,
  freqHz: number,
  sampleRate: number,
): number => {
  const coeff = 2 * Math.cos((2 * Math.PI * freqHz) / sampleRate);
  let prev = 0;
  let prev2 = 0;
  for (let i = 0; i < frame.length; i++) {
    const current = frame[i] + coeff * prev - prev2;
    prev2 = prev;
    prev = current;
  }
  const power = prev * prev + prev2 * prev2 - coeff * prev * prev2;
  const half = frame.length / 2;
  return power / (half * half);
};

export const toDb = (power: number): number => {
  if (power <= 0) {
    return MIN_DB;
  }
  return Math.max(MIN_DB, 10 * Math.log10(power));
};

export const goertzelBank = (
  frame: Float32Array,
  freqs: number[],
  sampleRate: number,
): number[] => {
  const windowed = applyHann(frame);
  return freqs.map((freq) => toDb(goertzelPower(windowed, freq, sampleRate)));
};

export const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
};

export interface NoiseFloor {
  history: number[][];
  size: number;
}

export const createNoiseFloor = (
  bandCount: number,
  size: number = NOISE_HISTORY,
): NoiseFloor => {
  return {
    history: Array.from({ length: bandCount }, () => []),
    size,
  };
};

export const updateNoiseFloor = (
  floor: NoiseFloor,
  levels: number[],
): number[] => {
  return levels.map((level, band) => {
    const history = floor.history[band];
    history.push(level);
    if (history.length > floor.size) {
      history.shift();
    }
    return median(history);
  });
};

export const getSnr = (levels: number[], floorLevels: number[]): number[] => {
  return levels.map((level, band) => level - floorLevels[band]);
};
