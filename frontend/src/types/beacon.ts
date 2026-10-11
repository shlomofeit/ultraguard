export type BeaconType = "silverpush" | "mosquito" | "lisnr" | "chirp" | "tone";

export interface ToneSegment {
  kind: "tones";
  freqsHz: number[];
  durationMs: number;
}

export interface SweepSegment {
  kind: "sweep";
  fromHz: number;
  toHz: number;
  durationMs: number;
}

export type Segment = ToneSegment | SweepSegment;

export interface BeaconFormValues {
  type: BeaconType;
  text: string;
}

export interface BeaconFormErrors {
  text?: string;
}
