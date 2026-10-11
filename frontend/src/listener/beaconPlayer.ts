import type { BeaconType } from "../types/beacon";
import { getRepeatMs } from "./beacons";
import { generateBeacon, msToSamples } from "./beaconGenerator";

let ctx: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;

export const startBeacon = async (
  type: BeaconType,
  text: string,
): Promise<number> => {
  stopBeacon();
  ctx = new AudioContext();
  await ctx.resume();

  const samples = generateBeacon(type, text, ctx.sampleRate);
  const length = Math.max(
    samples.length,
    msToSamples(getRepeatMs(type), ctx.sampleRate),
  );
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  buffer.getChannelData(0).set(samples);

  source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(ctx.destination);
  source.start();

  return ctx.sampleRate;
};

export const stopBeacon = (): void => {
  if (source) {
    source.stop();
    source.disconnect();
    source = null;
  }
  if (ctx) {
    void ctx.close();
    ctx = null;
  }
};
